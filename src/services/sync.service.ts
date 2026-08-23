import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { SyncState } from '../pojo/enums/sync-state.enum';
import { now } from '../utils/date.util';
import { LogRunner } from './log-runner';
import { MaterializeService } from './materialize.service';
import { BusinessType } from 'src/pojo/enums/business-type.enum';
import { OperateType } from 'src/pojo/enums/operate-type.enum';
import { UserService } from './user.service';
import { TokenService } from './token.service';
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
    private readonly materializeService: MaterializeService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly cacheService: BaseCacheService,
    @InjectRepository(AccountBook)
    private readonly accountBookRepository: Repository<AccountBook>,
    @InjectRepository(AccountBookUser)
    private readonly accountBookUserRepository: Repository<AccountBookUser>,
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
        .where('log.id IN (:...ids)', { ids: logs.map((l) => l.id) })
        .getMany();
      existingIds.push(...existingLogs.map((l) => l.id));
    }

    // 2. 处理日志，跳过已存在的
    if (logs.length > 0) {
      for (const log of logs) {
        if (existingIds.includes(log.id)) {
          // 已存在，直接返回已同步状态
          results.push(LogResult.success(log));
          continue;
        }
        // 数据隔离：拒绝 operatorId 与当前登录用户不符的日志（防止冒充他人身份写日志）
        if (log.operatorId !== userId) {
          results.push(
            LogResult.error(
              log,
              `operatorId(${log.operatorId}) 与当前登录用户(${userId})不符，拒绝同步`,
            ),
          );
          continue;
        }
        // 数据隔离：book 作用域日志要求操作者是该账本创建者/成员，防止向他人账本投毒。
        // 例外：新建账本（businessType=book && create，parentId=businessId，账本尚不存在）
        const isBookCreate =
          log.businessType === BusinessType.BOOK &&
          log.operateType === OperateType.CREATE;
        if (log.parentType === 'book' && !isBookCreate) {
          const allowed = await this.canOperateBook(log.parentId, userId);
          if (!allowed) {
            results.push(
              LogResult.error(log, `无权操作账本 ${log.parentId}，拒绝同步`),
            );
            continue;
          }
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
      await this.cacheService.set(
        `commit:${commitId}`,
        JSON.stringify(processedIds),
      );
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

    // 5. 异步触发日志回放落库（不阻塞 push 响应；回放由 MaterializeService 独立处理）
    if (processedIds.length > 0) {
      void this.materializeService.flush().catch((error: any) => {
        this.logger.error(`日志回放后台任务失败: ${error?.message}`);
      });
    }

    return { results, syncTimeStamp: currentTime, totalChanges, commitId };
  }

  /**
   * 拉取服务端变更（支持分页）
   * @param dto 拉取请求参数
   * @param userId 用户ID
   * @returns 拉取结果
   */
  async pull(dto: SyncPullDto, userId: string): Promise<SyncPullResult> {
    const currentTime = now();

    // 数据隔离前置：先回放待处理日志，保证账本成员关系是最新的
    // （新成员加入的 bookMember 日志在邀请者 push 时落库，这里确保已被回放到成员关系表）
    await this.materializeService.flush();

    // 构建查询
    const qb = this.logSyncRepository
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
      .where('sync_state = :syncState', { syncState: SyncState.SYNCED })
      .andWhere('sync_time > :syncTime', { syncTime: dto.syncTimeStamp });

    // 数据隔离：可见范围 = 自己的日志 + 自己参与账本（创建/成员）下的日志 + 关于自己的成员事件
    // + 同账本成员的 USER 资料日志（保证客户端 userId → 用户名翻译所需的用户数据可同步）
    const myBookIds = await this.getMyBookIds(userId);
    let memberUserIds: string[] = [];
    if (myBookIds.length > 0) {
      memberUserIds = await this.getBookMemberIds(myBookIds);
    }
    qb.andWhere(
      new Brackets((sub) => {
        sub.where('log.operator_id = :userId', { userId });
        if (myBookIds.length > 0) {
          sub.orWhere(
            "log.parent_type = 'book' AND log.parent_id IN (:...myBookIds)",
            { myBookIds },
          );
        }
        // 同账本成员（创建者/成员）的 USER 资料日志常驻可见，
        // 客户端据此把 userId 翻译成昵称；敏感字段（username/password/phone/email）
        // 由 desensitize 统一脱敏，此处只放行昵称/头像等展示所需字段
        if (memberUserIds.length > 0) {
          sub.orWhere(
            "log.business_type = 'user' AND log.operator_id IN (:...memberUserIds)",
            { memberUserIds },
          );
        }
        // 关于我的 bookMember 事件（加入/移除）常驻可见，即使我已不是成员，
        // 使被移除者能收到"自己被移除"的通知（依赖客户端在 delete 日志携带 userId）
        sub.orWhere(
          "log.business_type = 'bookMember' AND json_extract(log.operate_data, '$.userId') = :userId",
          { userId },
        );
      }),
    );

    // 业务类型过滤
    if (dto.businessTypes?.length) {
      qb.andWhere('log.businessType IN (:...businessTypes)', {
        businessTypes: dto.businessTypes,
      });
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

  /**
   * 用户参与的账本 ID 集合 = 创建的账本（account_books.created_by）∪ 作为成员加入的账本
   * （rel_accountbook_user.user_id）。成员关系来自日志回放落库，pull 前已 flush 保证最新。
   */
  private async getMyBookIds(userId: string): Promise<string[]> {
    const created = await this.accountBookRepository
      .createQueryBuilder('book')
      .select('book.id')
      .where('book.created_by = :userId', { userId })
      .getMany();
    const memberships = await this.accountBookUserRepository
      .createQueryBuilder('rel')
      .select('rel.accountBookId')
      .where('rel.user_id = :userId', { userId })
      .getMany();
    return [
      ...new Set([
        ...created.map((b) => b.id),
        ...memberships.map((r) => r.accountBookId),
      ]),
    ];
  }

  /**
   * 账本集合的成员用户 ID 集合 = 创建者（account_books.created_by）∪ 成员
   * （rel_accountbook_user.user_id）。用于 pull 时让同账本成员的 user 资料
   * 日志互相可见，支持客户端 userId → 用户名的翻译。
   */
  private async getBookMemberIds(bookIds: string[]): Promise<string[]> {
    const creators = await this.accountBookRepository
      .createQueryBuilder('book')
      .select('book.createdBy')
      .where('book.id IN (:...bookIds)', { bookIds })
      .getMany();
    const members = await this.accountBookUserRepository
      .createQueryBuilder('rel')
      .select('rel.userId')
      .where('rel.account_book_id IN (:...bookIds)', { bookIds })
      .getMany();
    return [
      ...new Set([
        ...creators.map((b) => b.createdBy),
        ...members.map((r) => r.userId),
      ]),
    ].filter((id): id is string => Boolean(id));
  }

  /**
   * 操作者是否可向某账本写入日志 = 该账本存在且操作者是创建者/成员。
   * 账本尚不存在（未落库或未知 id）时乐观放行，避免新建账本后立即记账被误拒。
   */
  private async canOperateBook(
    bookId: string,
    operatorId: string,
  ): Promise<boolean> {
    const exists = await this.accountBookRepository.existsBy({ id: bookId });
    if (!exists) {
      return true;
    }
    const myBookIds = await this.getMyBookIds(operatorId);
    return myBookIds.includes(bookId);
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
