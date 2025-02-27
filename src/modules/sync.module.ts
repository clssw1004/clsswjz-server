import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { SyncController } from '../controllers/sync.controller';
import { LogSyncService } from '../services/log-sync.service';
import { SyncService } from '../services/sync.service';
import { AccountModule } from './account.module';
import { AuthModule } from './auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([LogSync]), AccountModule, AuthModule],
  controllers: [SyncController],
  providers: [LogSyncService, SyncService],
  exports: [LogSyncService, SyncService],
})
export class SyncModule {}
