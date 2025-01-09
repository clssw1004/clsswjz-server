import { Body, Controller, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BatchUploadLogsDto } from '../pojo/dto/log-sync/batch-upload.dto';
import { LogSyncService } from '../services/log-sync.service';
import { SyncResult } from '../pojo/dto/log-sync/sync-result.dto';

@ApiTags('客户端同步')
@Controller('sync')
export class LogSyncController {
  constructor(private readonly logSyncService: LogSyncService) {}

  @ApiOperation({ summary: '客户端同步' })
  @Post('changes')
  async syncChanges(
    @Body() dto: BatchUploadLogsDto,
    @Request() req,
  ): Promise<SyncResult> {
    return await this.logSyncService.sync(
      dto.logs,
      req.user.sub,
      dto.syncTimeStamp,
      true,
    );
  }
}
