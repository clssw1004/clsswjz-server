import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { SyncController } from '../controllers/sync.controller';
import { SyncService } from '../services/sync.service';
import { LogRunner } from '../services/log-runner';
import { MaterializeService } from '../services/materialize.service';
import { BaseCacheService } from '../services/cache.service';
import { LruCacheService } from '../services/lru-cache.service';
import { AccountModule } from './account.module';
import { AuthModule } from './auth.module';
import { AttachmentModule } from './attachment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogSync]),
    AccountModule,
    AuthModule,
    AttachmentModule,
  ],
  controllers: [SyncController],
  providers: [
    SyncService,
    LogRunner,
    MaterializeService,
    { provide: BaseCacheService, useClass: LruCacheService },
  ],
  exports: [SyncService, LogRunner, MaterializeService],
})
export class SyncModule {}
