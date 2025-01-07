import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, MoreThan, Repository } from 'typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { SyncState } from '../pojo/enums/sync-state.enum';
import { now } from '../utils/date.util';
import { LogResult, SyncResult } from '../pojo/dto/log-sync/sync-result.dto';
import { SyncService } from './sync.service';

@Injectable()
export class LogSyncService {
  constructor(
    @InjectRepository(LogSync)
    private readonly logSyncRepository: Repository<LogSync>,
    private readonly syncService: SyncService,
  ) {}

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
          await this.syncService.runLogSync(log, transactionalEntityManager);
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
    shouldFetchChanges = true,
  ): Promise<SyncResult> {
    const currentTime = now();

    // 1. 处理客户端上传的日志
    const results =
      logs.length > 0
        ? await Promise.all(
            logs.map((log) => this.processLog(log, currentTime)),
          )
        : [];

    // 2. 获取服务器端变更（其他设备上传的日志）
    const changes = shouldFetchChanges
      ? await this.logSyncRepository.find({
          where: {
            operatorId: userId,
            syncState: SyncState.SYNCED,
            ...(lastSyncTime && { syncTime: MoreThan(lastSyncTime) }),
            ...(logs.length > 0 && { id: Not(In(logs.map((log) => log.id))) }),
          },
          order: {
            operatedAt: 'ASC',
          },
        })
      : logs;

    // 3. 返回结果
    return {
      results,
      changes,
      syncTimeStamp: currentTime,
    };
  }
}
