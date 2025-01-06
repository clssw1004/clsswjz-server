import { ApiProperty } from '@nestjs/swagger';
import { LogSync } from '../../entities/log-sync.entity';
import { SyncState } from '../../enums/sync-state.enum';

export class LogResult {
  @ApiProperty({ description: '日志ID' })
  id: string;

  @ApiProperty({ description: '同步状态' })
  syncState: SyncState;

  @ApiProperty({ description: '同步错误信息' })
  syncError?: string;

  static success(log: LogSync): LogResult {
    const result = new LogResult();
    result.id = log.id;
    result.syncState = SyncState.SYNCED;
    return result;
  }

  static error(log: LogSync, error: string): LogResult {
    const result = new LogResult();
    result.id = log.id;
    result.syncState = SyncState.FAILED;
    result.syncError = error;
    return result;
  }
}

export class SyncResult {
  @ApiProperty({ type: [LogResult], description: '同步结果列表' })
  results: LogResult[];

  @ApiProperty({ type: [LogSync], description: '变更数据列表' })
  changes: LogSync[];
}
