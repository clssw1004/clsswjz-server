import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { BusinessType } from '../pojo/enums/business-type.enum';
import { SyncState } from '../pojo/enums/sync-state.enum';
import { LogRunner } from './log-runner';
import { now } from '../utils/date.util';

export interface FlushResult {
  /** 成功回放并打标的日志数 */
  processed: number;
  /** 回放失败的日志数 */
  failed: number;
}

/**
 * 日志回放落库服务：把 log_sync 中已同步（SYNCED）但尚未回放（materialized_at IS NULL）
 * 的日志，按 operated_at 升序回放到业务表（account_books / account_items ...）。
 *
 * - USER 类型已在 processLog 事务内落库，这里只打标，避免重复建用户/二次 bcrypt。
 * - 失败日志写 materialize_error，保留 pending 以便下次重试；失败不阻塞其它日志。
 * - 内部互斥锁防止并发 flush 重复回放。
 */
@Injectable()
export class MaterializeService {
  private readonly logger = new Logger(MaterializeService.name, {
    timestamp: true,
  });
  private flushPromise: Promise<FlushResult> | null = null;

  constructor(
    @InjectRepository(LogSync)
    private readonly logSyncRepository: Repository<LogSync>,
    private readonly logRunner: LogRunner,
  ) {}

  /**
   * 回放所有待处理日志，直到没有待处理或本轮无进展。
   * 若已在回放中，返回同一个 in-flight Promise（并发调用共享一次回放，调用方可等待其完成）。
   * @returns 本次回放的统计结果
   */
  async flush(opts: { limit?: number } = {}): Promise<FlushResult> {
    if (this.flushPromise) {
      return this.flushPromise;
    }
    const promise = this.doFlush(opts);
    this.flushPromise = promise;
    try {
      return await promise;
    } finally {
      this.flushPromise = null;
    }
  }

  private async doFlush(opts: { limit?: number }): Promise<FlushResult> {
    const limit = opts.limit ?? 200;
    const result: FlushResult = { processed: 0, failed: 0 };
    const attempted = new Set<string>();
    while (true) {
      const pending = (
        await this.logSyncRepository.find({
          where: { syncState: SyncState.SYNCED, materializedAt: IsNull() },
          order: { operatedAt: 'ASC' },
          take: limit,
        })
      ).filter((log) => !attempted.has(log.id));
      if (pending.length === 0) {
        break;
      }
      let progressed = 0;
      for (const log of pending) {
        attempted.add(log.id);
        const before = result.processed;
        await this.applyOne(log, result);
        if (result.processed > before) {
          progressed++;
        }
      }
      // 本轮无任何日志被落库（全是失败/跳过）时停止，避免对永久失败日志无限重试
      if (progressed === 0) {
        break;
      }
    }
    return result;
  }

  /**
   * 重头回放：清空业务表 + 清除全部 synced 日志的回放标记，使所有日志进入待回放。
   * 之后调用 flush() 即从日志完整重建业务数据。不触碰 users / log_sync 记录本身。
   * 用于：业务表结构变更、回放逻辑升级、需要推倒重建业务数据时。
   */
  async reset(): Promise<void> {
    await this.logSyncRepository.manager.transaction(async (em) => {
      await this.logRunner.clearAllBusinessData(em);
      // 只重置 synced 日志的标记；failed/unsynced 不参与回放
      await em.query(
        'UPDATE log_sync SET materialized_at = NULL, materialize_error = NULL WHERE sync_state = ?',
        [SyncState.SYNCED],
      );
    });
  }

  private async applyOne(log: LogSync, result: FlushResult): Promise<void> {
    // USER 类型已在 processLog 事务内落库，这里只打标
    if (log.businessType === BusinessType.USER) {
      await this.markMaterialized(log.id);
      result.processed++;
      return;
    }

    // 服务端不支持的扩展类型（如 note/debt），跳过并打标，避免无限重试
    if (!this.logRunner.supports(log.businessType)) {
      await this.logSyncRepository.update(
        { id: log.id },
        {
          materializedAt: now(),
          materializeError: `不支持的业务类型: ${log.businessType}（已跳过）`,
        },
      );
      result.processed++;
      return;
    }

    try {
      await this.logSyncRepository.manager.transaction(async (em) => {
        const replay = await this.logRunner.runLogSync(log, em);
        if (replay.syncState !== SyncState.SYNCED) {
          throw new Error(replay.syncError || '日志回放失败');
        }
        await em.update(LogSync, { id: log.id }, { materializedAt: now() });
      });
      result.processed++;
    } catch (error: any) {
      result.failed++;
      // 保留 materialized_at 为 NULL 以便下次重试
      await this.logSyncRepository.update(
        { id: log.id },
        { materializeError: error?.message ?? String(error) },
      );
    }
  }

  private async markMaterialized(id: string): Promise<void> {
    await this.logSyncRepository.update({ id }, { materializedAt: now() });
  }
}
