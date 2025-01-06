import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
   * 批量上传日志
   * @param logs 日志列表
   * @returns 上传结果
   */
  async syncClientLogs(logs: LogSync[]): Promise<SyncResult> {
    // 设置日志状态为已同步
    const results: LogResult[] = logs.map((log) => {
      log.syncState = SyncState.SYNCED;
      log.syncTime = now();
      return LogResult.success(log);
    });
    await this.logSyncRepository.save(logs);
    return {
      results,
      changes: logs,
    };
  }

  async fetchAllLogs(userId: string): Promise<SyncResult> {
    const logs = await this.logSyncRepository.find({
      where: { operatorId: userId },
      order: { operatedAt: 'ASC' },
    });
    return {
      results: [],
      changes: logs,
    };
  }

  async pushAllLogs(logs: LogSync[]): Promise<SyncResult> {
    try {
      return await this.logSyncRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const results = await Promise.all(
            logs.map((log) =>
              this.syncService.runLogSync(log, transactionalEntityManager),
            ),
          );
          await transactionalEntityManager.save(LogSync, logs);
          return {
            results,
            changes: logs,
          };
        },
      );
    } catch (error) {
      // 如果事务执行失败，将所有日志标记为同步失败
      logs.forEach((log) => {
        log.syncState = SyncState.FAILED;
        log.syncError = error.message;
      });
      await this.logSyncRepository.save(logs);
      return {
        results: logs.map((log) => LogResult.error(log, error.message)),
        changes: logs,
      };
    }
  }
}
