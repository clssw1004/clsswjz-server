import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { SyncState } from '../pojo/enums/sync-state.enum';

/** 系统信息：运行环境 + 数据库 + 同步回放状态（运维排障用） */
@Injectable()
export class AdminSystemService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(LogSync)
    private readonly logSyncRepository: Repository<LogSync>,
  ) {}

  async info() {
    const pkg = require('../../package.json');
    const dbType = this.configService.get<string>('DB_TYPE', 'sqlite');

    const total = await this.logSyncRepository.count({
      where: { syncState: SyncState.SYNCED },
    });
    const materialized = await this.logSyncRepository
      .createQueryBuilder('log')
      .where('log.syncState = :st', { st: SyncState.SYNCED })
      .andWhere('log.materializedAt IS NOT NULL')
      .getCount();
    const failed = await this.logSyncRepository
      .createQueryBuilder('log')
      .where('log.syncState = :st', { st: SyncState.SYNCED })
      .andWhere('log.materializedAt IS NULL')
      .andWhere("log.materializeError != ''")
      .getCount();

    return {
      version: pkg?.version ?? 'unknown',
      node: process.version,
      uptimeSec: Math.round(process.uptime()),
      env: this.configService.get<string>('NODE_ENV', 'development'),
      serverTime: Date.now(),
      database: {
        type: dbType,
        host: dbType !== 'sqlite' ? this.configService.get<string>('DB_HOST') : undefined,
        database: this.configService.get<string>('DB_DATABASE'),
      },
      replay: { total, materialized, pending: total - materialized - failed, failed },
    };
  }
}
