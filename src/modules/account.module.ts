import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { User } from '../pojo/entities/user.entity';
import { UserService } from '../services/user.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/auth.guard';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { HealthController } from '../controllers/health.controller';
import { HealthService } from '../services/health.service';
import { AttachmentModule } from './attachment.module';
import { AccountSymbol } from '../pojo/entities/account-symbol.entity';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountItem,
      AccountBook,
      AccountCategory,
      User,
      AccountBookUser,
      AccountFund,
      AccountShop,
      AccountSymbol,
    ]),
    AttachmentModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    UserService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    HealthService,
  ],
  exports: [UserService, TypeOrmModule],
})
export class AccountModule {}
