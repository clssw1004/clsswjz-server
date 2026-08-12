import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../pojo/entities/user.entity';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { SyncModule } from './sync.module';

/**
 * 管理台模块：独立管理员认证（env 账号 + JWT），运维查询走 AdminService。
 * 普通用户 token 体系不受影响。
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, LogSync, AccountBook, AccountBookUser]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('ADMIN_JWT_EXPIRES_IN') || '12h',
        },
      }),
    }),
    // 提供 MaterializeService（管理台手动触发回放）
    SyncModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminAuthGuard],
})
export class AdminModule {}
