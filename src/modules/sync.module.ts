import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { SyncController } from '../controllers/sync.controller';
import { SyncService } from '../services/sync.service';
import { LogRunner } from '../services/log-runner';
import { BaseCacheService } from '../services/cache.service';
import { LruCacheService } from '../services/lru-cache.service';
import { AccountModule } from './account.module';
import { AuthModule } from './auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([LogSync]), AccountModule, AuthModule],
  controllers: [SyncController],
  providers: [
    SyncService,
    LogRunner,
    { provide: BaseCacheService, useClass: LruCacheService },
  ],
  exports: [SyncService, LogRunner],
})
export class SyncModule {}
