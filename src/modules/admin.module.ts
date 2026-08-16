import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../pojo/entities/user.entity';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { AccountSymbol } from '../pojo/entities/account-symbol.entity';
import { AccountNote } from '../pojo/entities/account-note.entity';
import { AdminController } from '../controllers/admin.controller';
import { AdminUserController } from '../controllers/admin-user.controller';
import { AdminLogController } from '../controllers/admin-log.controller';
import { AdminStatsController } from '../controllers/admin-stats.controller';
import { AdminItemController } from '../controllers/admin-item.controller';
import { AdminBookController } from '../controllers/admin-book.controller';
import { AdminSystemController } from '../controllers/admin-system.controller';
import { AdminMaintenanceController } from '../controllers/admin-maintenance.controller';
import { AdminNoteController } from '../controllers/admin-note.controller';
import { AdminService } from '../services/admin.service';
import { AdminStatsService } from '../services/admin-stats.service';
import { AdminItemService } from '../services/admin-item.service';
import { AdminBookService } from '../services/admin-book.service';
import { AdminSystemService } from '../services/admin-system.service';
import { AdminMaintenanceService } from '../services/admin-maintenance.service';
import { AdminNoteService } from '../services/admin-note.service';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { SyncModule } from './sync.module';

/**
 * 管理台模块：独立管理员认证（env 账号 + JWT），运维查询走 AdminService。
 * 普通用户 token 体系不受影响。
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      LogSync,
      AccountBook,
      AccountBookUser,
      AccountItem,
      AccountCategory,
      AccountShop,
      AccountFund,
      AccountSymbol,
      AccountNote,
    ]),
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
  controllers: [
    AdminController,
    AdminUserController,
    AdminLogController,
    AdminStatsController,
    AdminItemController,
    AdminBookController,
    AdminSystemController,
    AdminMaintenanceController,
    AdminNoteController,
  ],
  providers: [
    AdminService,
    AdminStatsService,
    AdminItemService,
    AdminBookService,
    AdminSystemService,
    AdminMaintenanceService,
    AdminNoteService,
    AdminAuthGuard,
  ],
})
export class AdminModule {}
