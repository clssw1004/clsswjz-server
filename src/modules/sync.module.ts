import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { LogSyncController } from '../controllers/log-sync.controller';
import { LogSyncService } from '../services/log-sync.service';
import { SyncService } from '../services/sync.service';
import { AccountModule } from './account.module';

@Module({
  imports: [TypeOrmModule.forFeature([LogSync]), AccountModule],
  controllers: [LogSyncController],
  providers: [LogSyncService, SyncService],
  exports: [LogSyncService, SyncService],
})
export class SyncModule {}
