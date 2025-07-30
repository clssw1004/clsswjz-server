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
  SyncResult,
} from 'src/pojo/dto/log-sync/sync.dto';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name, { timestamp: true });
  constructor(
    @InjectRepository(LogSync)
    private readonly logSyncRepository: Repository<LogSync>,
    private readonly logRunner: LogRunner,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
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
      // 需要执行同步操作
      await this.logSyncRepository.manager.transaction(
        async (transactionalEntityManager) => {
          log.syncTime = currentTime;
          log.syncState = SyncState.SYNCED;
          if (log.businessType === BusinessType.USER) {
            // 目前只有用户信息是需要的,其他业务类型不需要同步到库
            await this.logRunner.runLogSync(log, transactionalEntityManager);
          }
          await transactionalEntityManager.save(LogSync, log);
        },
      );

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
   * 同步数据
   * @param logs 客户端日志列表
   * @param userId 用户ID
   * @param lastSyncTime 最后同步时间
   * @param shouldRunSync 是否执行同步操作
   * @param shouldFetchChanges 是否获取服务器变更
   * @returns 同步结果
   */
  async sync(
    logs: LogSync[] = [],
    userId: string,
    lastSyncTime?: number,
  ): Promise<SyncResult> {
    const currentTime = now();

    // 1. 处理客户端上传的日志
    const results = [];
    if (logs.length > 0) {
      for (const log of logs) {
        const result = await this.processLog(log, currentTime);
        results.push(result);
      }
    }

    // 2. 获取服务器端变更（其他设备上传的日志）
    const commonWhere = [
      'sync_state = :syncState',
      lastSyncTime ? 'sync_time > :lastSyncTime' : null,
      logs.length > 0 ? 'id NOT IN (:...logIds)' : null,
    ]
      .filter(Boolean)
      .join(' AND ');

    const commonParams = {
      syncState: SyncState.SYNCED,
      ...(lastSyncTime && { lastSyncTime }),
      ...(logs.length > 0 && { logIds: logs.map((log) => log.id) }),
    };

    // 使用QueryBuilder构建查询
    const query = this.logSyncRepository
      .createQueryBuilder('log')
      .select([
        'log.id',
        'log.businessType',
        'log.operateType',
        'log.parentType',
        'log.parentId',
        'log.operatorId',
        'log.operatedAt',
        'log.businessId',
        'log.operateData',
        'log.syncState',
        'log.syncTime',
        'log.syncError',
      ])
      .where(commonWhere, commonParams)
      .orderBy('log.operatedAt', 'ASC');

    const changes = await query.getMany();
    await this.desensitize(changes, userId);

    // 3. 返回结果
    return {
      results,
      changes,
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
