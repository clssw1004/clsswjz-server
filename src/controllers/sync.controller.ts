import { Controller, Post, Body, Request, Get } from '@nestjs/common';
import { SyncService } from '../services/sync.service';
import { SyncDataDto } from '../pojo/dto/sync/sync-data.dto';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('initial')
  async getInitialData(@Request() req) {
    const data = await this.syncService.getInitialData(req.user.sub);
    return {
      data,
      serverTime: new Date().toISOString(),
    };
  }

  @Post('batch')
  async syncBatch(@Body() syncData: SyncDataDto, @Request() req) {
    const result = await this.syncService.syncBatch(syncData, req.user.sub);
    return {
      ...result,
      serverTime: new Date().toISOString(),
    };
  }
}
