import { Body, Controller, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BatchUploadLogsDto } from '../pojo/dto/log-sync/batch-upload.dto';
import { LogSyncService } from '../services/log-sync.service';
import { SyncResult } from '../pojo/dto/log-sync/sync-result.dto';

@ApiTags('日志同步')
@Controller('sync')
export class LogSyncController {
  constructor(private readonly logSyncService: LogSyncService) {}

  @ApiOperation({ summary: '批量上传日志' })
  @Post('syncChanges')
  async syncChanges(
    @Body() dto: BatchUploadLogsDto,
    @Request() req,
  ): Promise<SyncResult> {
    dto.logs.forEach((log) => {
      log.operatorId = req.user.sub;
    });
    return await this.logSyncService.syncClientLogs(dto.logs);
  }

  @ApiOperation({ summary: '同步所有日志' })
  @Post('fetch/all')
  async fetchAll(@Request() req): Promise<SyncResult> {
    return await this.logSyncService.fetchAllLogs(req.user.sub);
  }

  @ApiOperation({ summary: '推送所有日志' })
  @Post('push/all')
  async pushAll(
    @Body() dto: BatchUploadLogsDto,
    @Request() req,
  ): Promise<SyncResult> {
    dto.logs.forEach((log) => {
      log.operatorId = req.user.sub;
    });
    return await this.logSyncService.pushAllLogs(dto.logs);
  }
}
