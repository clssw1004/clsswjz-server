import { Body, Controller, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RegisterSyncDto,
  SyncDto,
  SyncResult,
} from '../pojo/dto/log-sync/sync.dto';
import { LogSyncService } from '../services/log-sync.service';
import { LogSync } from 'src/pojo/entities/log-sync.entity';
import { Public } from 'src/decorators/public';

@ApiTags('客户端同步')
@Controller('sync')
export class LogSyncController {
  constructor(private readonly logSyncService: LogSyncService) {}

  @ApiOperation({ summary: '客户端同步' })
  @Post('changes')
  async syncChanges(@Body() dto: SyncDto, @Request() req): Promise<SyncResult> {
    return await this.logSyncService.sync(
      dto.logs,
      req.user.sub,
      dto.syncTimeStamp,
      true,
    );
  }

  @Public()
  async syncRegister(@Body() registerLog: RegisterSyncDto) {
    return await this.logSyncService.syncRegister(registerLog);
  }
}
