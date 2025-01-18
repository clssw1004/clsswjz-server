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
