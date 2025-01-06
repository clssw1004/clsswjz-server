// import { Controller, Post, Body, Request, Get } from '@nestjs/common';
// import { SyncService } from '../services/sync.service';
// import { SyncDataDto } from '../pojo/dto/sync/sync-data.dto';

// @Controller('sync')
// export class SyncController {
//   constructor(private readonly syncService: SyncService) {}

//   @Get('initial')
//   async getInitialData(@Request() req) {
//     return await this.syncService.getInitialData(req.user.sub);
//   }

//   @Post('batch')
//   async syncBatch(@Body() syncData: SyncDataDto, @Request() req) {
//     return await this.syncService.syncBatch(syncData, req.user.sub);
//   }
// }
