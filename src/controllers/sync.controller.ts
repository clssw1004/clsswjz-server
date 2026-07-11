import { Body, Controller, Get, Logger, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RegisterSyncDto,
  SyncDto,
  SyncPullDto,
  SyncPushResult,
  SyncPullResult,
} from '../pojo/dto/log-sync/sync.dto';
import { SyncService } from '../services/sync.service';
import { Public } from 'src/decorators/public';
import { getCache, setCache } from 'src/utils/cache.util';

@ApiTags('客户端同步')
@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name, { timestamp: true });

  constructor(private readonly syncService: SyncService) {}

  @ApiOperation({ summary: '推送本地变更到服务端' })
  @Post('push')
  async push(@Body() dto: SyncDto, @Request() req): Promise<SyncPushResult> {
    return await this.syncService.push(dto.logs, req.user.sub, dto.syncTimeStamp);
  }

  @ApiOperation({ summary: '拉取服务端变更（支持分页）' })
  @Post('pull')
  async pull(@Body() dto: SyncPullDto, @Request() req): Promise<SyncPullResult> {
    return await this.syncService.pull(dto, req.user.sub);
  }

  @ApiOperation({ summary: '注册用户(日志)' })
  @Public()
  @Post('register')
  async syncRegister(@Body() registerLog: RegisterSyncDto) {
    return await this.syncService.syncRegister(registerLog);
  }

  @ApiOperation({ summary: '设置缓存' })
  @Post('tmp/set')
  async setTmpData(@Body() dto: { key: string, value: string }) {
    this.logger.log(`setTmpData: ${dto.key}`, dto.value);
    return setCache(dto.key, dto.value);
      
  }

  @ApiOperation({ summary: '获取缓存' })
  @Post('tmp/get')
  async getTmpData(@Body() dto: { key: string }) {
    const value = getCache(dto.key);
    this.logger.log(`getTmpData: ${dto.key}`, value);
    return value;
  }
}
