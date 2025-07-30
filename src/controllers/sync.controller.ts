import { Body, Controller, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RegisterSyncDto,
  SyncDto,
  SyncResult,
} from '../pojo/dto/log-sync/sync.dto';
import { SyncService } from '../services/sync.service';
import { Public } from 'src/decorators/public';

@ApiTags('客户端同步')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @ApiOperation({ summary: '客户端同步' })
  @Post('changes')
  async syncChanges(@Body() dto: SyncDto, @Request() req): Promise<SyncResult> {
    return await this.syncService.sync(
      dto.logs,
      req.user.sub,
      dto.syncTimeStamp,
    );
  }

  @ApiOperation({ summary: '注册用户(日志)' })
  @Public()
  @Post('register')
  async syncRegister(@Body() registerLog: RegisterSyncDto) {
    return await this.syncService.syncRegister(registerLog);
  }
}
