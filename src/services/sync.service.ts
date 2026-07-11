import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { SyncState } from '../pojo/enums/sync-state.enum';
import { now } from '../utils/date.util';
import { LogRunner } from './log-runner';
import { BusinessType } from 'src/pojo/enums/business-type.enum';
import { OperateType } from 'src/pojo/enums/operate-type.enum';
import { UserService } from './user.service';
import { TokenService } from './token.service';
import _ from 'lodash'
import {
  LogResult,
  RegisterSyncDto,
  SyncPushResult,
  SyncPullDto,
  SyncPullResult,
} from 'src/pojo/dto/log-sync/sync.dto';
import { BaseCacheService } from './cache.service';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name, { timestamp: true });
  constructor(
    @InjectRepository(LogSync)
    private readonly logSyncRepository: Repository<LogSync>,
    private readonly logRunner: LogRunner,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly cacheService: BaseCacheService,
  ) {}

  async syncRegister(createUserLog: RegisterSyncDto) {
    // 2. 创建用户
    const { user, log } = await this.userService.create(createUserLog);
    await this.logSyncRepository.save(log);
    // 3. 签发token
    const token = await this.tokenService.generateToken(user.id, {
      ...user,
      clientType: createUserLog.clientType,
      clientId: createUserLog.clientId,
      clientName: createUserLog.clientName,
    });
    // 4. 返回结果
    return {
      access_token: token,
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
    };
  }

  /**
   * 处理单条日志
   * @param log 日志对象
   * @param currentTime 当前时间戳
   * @param shouldRunSync 是否执行同步操作
   * @returns 处理结果
   */
  private async processLog(
    log: LogSync,
    currentTime: number,
  ): Promise<LogResult> {
    try {
      log.syncTime = currentTime;
      log.syncState = SyncState.SYNCED;

      if (log.businessType === BusinessType.USER) {
        // USER 类型需要在事务中执行同步操作（创建用户实体 + 记录同步日志）
        await this.logSyncRepository.manager.transaction(
          async (transactionalEntityManager) => {
            await this.logRunner.runLogSync(log, transactionalEntityManager);
            await transactionalEntityManager.save(LogSync, log);
          },
        );
      } else {
        // 非 USER 类型只需保存日志记录，直接写入避免 SQLite SAVEPOINT 兼容问题
        await this.logSyncRepository.save(log);
      }

      return LogResult.success(log);
    } catch (error) {
      // 处理失败
      log.syncState = SyncState.FAILED;
      log.syncError = error.message;
      log.syncTime = currentTime;
      await this.logSyncRepository.save(log);
      return LogResult.error(log, error.message);
    }
  }

  /**
   * 推送本地变更到服务端
   * @param logs 客户端日志列表
   * @param userId 用户ID
   * @param lastSyncTime 最后同步时间
   * @returns 推送结果
   */
  async push(
    logs: LogSync[] = [],
    userId: string,
    lastSyncTime?: number,
  ): Promise<SyncPushResult> {
    const currentTime = now();
    const results: LogResult[] = [];
    const processedIds: string[] = [];

    // 1. 批量检查哪些 logId 已存在（支持幂等性：前端切换后端后重新 push 不会产生重复）
    const existingIds: string[] = [];
    if (logs.length > 0) {
      const existingLogs = await this.logSyncRepository
        .createQueryBuilder('log')
        .select('log.id')
        .where('log.id IN (:...ids)', { ids: logs.map(l => l.id) })
        .getMany();
      existingIds.push(...existingLogs.map(l => l.id));
    }

    // 2. 处理日志，跳过已存在的
    if (logs.length > 0) {
      for (const log of logs) {
        if (existingIds.includes(log.id)) {
          // 已存在，直接返回已同步状态
          results.push(LogResult.success(log));
          continue;
        }
        const result = await this.processLog(log, currentTime);
        results.push(result);
        processedIds.push(log.id);
      }
    }

    // 3. 生成 commitId 并缓存已处理的 ID
    const { nanoid } = await import('nanoid');
    const commitId = nanoid();
    if (processedIds.length > 0) {
      await this.cacheService.set(`commit:${commitId}`, JSON.stringify(processedIds));
    }

    // 4. 统计待拉取变更总数
    let totalChanges = 0;
    const commonWhere = [
      'sync_state = :syncState',
      lastSyncTime ? 'sync_time > :lastSyncTime' : null,
      logs.length > 0 ? 'id NOT IN (:...logIds)' : null,
    ]
      .filter(Boolean)
      .join(' AND ');

    const countQuery = this.logSyncRepository
      .createQueryBuilder('log')
      .where(commonWhere, {
        syncState: SyncState.SYNCED,
        ...(lastSyncTime && { lastSyncTime }),
        ...(logs.length > 0 && { logIds: processedIds }),
      });

    totalChanges = await countQuery.getCount();

    return { results, syncTimeStamp: currentTime, totalChanges, commitId };
  }

  /**
   * 拉取服务端变更（支持分页）
   * @param dto 拉取请求参数
   * @param userId 用户ID
   * @returns 拉取结果
   */
  async pull(
    dto: SyncPullDto,
    userId: string,
  ): Promise<SyncPullResult> {
    const currentTime = now();

    // 构建查询
    const qb = this.logSyncRepository
      .createQueryBuilder('log')
      .select([
        'log.id', 'log.businessType', 'log.operateType',
        'log.parentType', 'log.parentId', 'log.operatorId',
        'log.operatedAt', 'log.businessId', 'log.operateData',
        'log.syncState', 'log.syncTime', 'log.syncError',
      ])
      .where('sync_state = :syncState', { syncState: SyncState.SYNCED })
      .andWhere('sync_time > :syncTime', { syncTime: dto.syncTimeStamp });

    // 业务类型过滤
    if (dto.businessTypes?.length) {
      qb.andWhere('log.businessType IN (:...businessTypes)', { businessTypes: dto.businessTypes });
    }

    // CommitId 排除已 push 的日志
    if (dto.commitId) {
      const cached = await this.cacheService.get(`commit:${dto.commitId}`);
      if (cached) {
        const excludeIds = JSON.parse(cached) as string[];
        qb.andWhere('log.id NOT IN (:...excludeIds)', { excludeIds });
      }
    }

    // 分页
    const [changes, total] = await qb
      .orderBy('log.operatedAt', 'ASC')
      .skip((dto.page - 1) * dto.pageSize)
      .take(dto.pageSize)
      .getManyAndCount();

    // 脱敏
    await this.desensitize(changes, userId);

    return {
      changes,
      total,
      page: dto.page,
      pageSize: dto.pageSize,
      syncTimeStamp: currentTime,
    };
  }

  private async desensitize(logs: LogSync[], userId: string) {
    return logs.forEach((log) => {
      // 如果不是用户相关的日志或者操作人是当前用户,直接返回原始日志
      if (log.businessType !== BusinessType.USER || log.operatorId === userId) {
        return;
      }

      // 只处理新增和更新操作
      if (![OperateType.CREATE, OperateType.UPDATE].includes(log.operateType)) {
        return;
      }

      // 解析操作数据
      const operateData = JSON.parse(log.operateData);

      // 脱敏敏感信息
      if (operateData.username) {
        operateData.username = '<secret>';
      }
      if (operateData.password) {
        operateData.password = '<secret>';
      }
      if (operateData.phone) {
        operateData.phone = '<secret>';
      }
      if (operateData.email) {
        operateData.email = '<secret>';
      }

      // 更新操作数据
      log.operateData = JSON.stringify(operateData);
      return log;
    });
  }
}
