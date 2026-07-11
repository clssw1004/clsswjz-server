import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { LogSync } from '../../entities/log-sync.entity';
import { SyncState } from 'src/pojo/enums/sync-state.enum';
import { CreateUserDto } from '../user/create-user.dto';

export class RegisterSyncDto extends CreateUserDto {
  @ApiProperty({
    description: '客户端类型',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  clientType: string;

  @ApiProperty({
    description: '客户端ID',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  clientId: string;

  @ApiProperty({
    description: '客户端名称',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  clientName: string;
}

export class SyncDto {
  @ApiProperty({
    type: [LogSync],
    description: '日志列表',
  })
  @IsArray()
  @Type(() => LogSync)
  logs: LogSync[];

  @ApiProperty({
    type: Number,
    description: '最后同步时间',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  syncTimeStamp?: number;

  @ApiProperty({
    type: [String],
    description: '按业务类型过滤返回的变更数据，为空则返回全量',
    required: false,
    example: ['user', 'book', 'bookMember'],
  })
  @IsArray()
  @IsOptional()
  businessTypes?: string[];
}

export class LogResult {
  @ApiProperty({ description: '日志ID' })
  logId: string;

  @ApiProperty({ description: '同步状态' })
  syncState: SyncState;

  @ApiProperty({ description: '同步错误信息' })
  syncError?: string;

  static success(log: LogSync): LogResult {
    const result = new LogResult();
    result.logId = log.id;
    result.syncState = SyncState.SYNCED;
    return result;
  }

  static error(log: LogSync, error: string): LogResult {
    const result = new LogResult();
    result.logId = log.id;
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

  @ApiProperty({ type: Number, description: '服务器当前时间戳' })
  syncTimeStamp: number;
}

// Push 响应
export class SyncPushResult {
  @ApiProperty({ type: [LogResult], description: '同步结果列表' })
  results: LogResult[];

  @ApiProperty({ type: Number, description: '服务器当前时间戳' })
  syncTimeStamp: number;

  @ApiProperty({ type: Number, description: '待拉取变更总数' })
  totalChanges: number;

  @ApiProperty({ type: String, description: '本次 push 的 commit ID' })
  commitId: string;
}

// Pull 请求
export class SyncPullDto {
  @ApiProperty({ type: Number, description: '最后同步时间' })
  @IsNumber()
  syncTimeStamp: number;

  @ApiProperty({ type: [String], description: '按业务类型过滤', required: false })
  @IsArray()
  @IsOptional()
  businessTypes?: string[];

  @ApiProperty({ type: Number, description: '页码', default: 1 })
  @IsNumber()
  page: number;

  @ApiProperty({ type: Number, description: '每页条数', default: 1000 })
  @IsNumber()
  pageSize: number;

  @ApiProperty({ type: String, description: 'commit ID，排除已 push 的日志', required: false })
  @IsString()
  @IsOptional()
  commitId?: string;
}

// Pull 响应
export class SyncPullResult {
  @ApiProperty({ type: [LogSync], description: '变更数据列表' })
  changes: LogSync[];

  @ApiProperty({ type: Number, description: '总条数' })
  total: number;

  @ApiProperty({ type: Number, description: '当前页码' })
  page: number;

  @ApiProperty({ type: Number, description: '每页条数' })
  pageSize: number;

  @ApiProperty({ type: Number, description: '服务器当前时间戳' })
  syncTimeStamp: number;
}
