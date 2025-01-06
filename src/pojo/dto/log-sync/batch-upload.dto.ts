import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { LogSync } from '../../entities/log-sync.entity';

export class BatchUploadLogsDto {
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
  lastSyncTime?: number;
}
