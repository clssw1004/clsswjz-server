import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountItemService } from '../services/account-item.service';
import { AccountBookService } from '../services/account-book.service';
import { AccountController } from '../controllers/account-item.controller';
import { AccountBookController } from '../controllers/account-book.controller';
import { AccountCategoryController } from '../controllers/account-category.controller';
import { AccountCategoryService } from '../services/account-category.service';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { User } from '../pojo/entities/user.entity';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/auth.guard';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { AccountFundController } from '../controllers/account-fund.controller';
import { AccountFundService } from '../services/account-fund.service';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { UserDataInitService } from '../services/user-data-init.service';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountShopController } from '../controllers/account-shop.controller';
import { AccountShopService } from '../services/account-shop.service';
import { HealthController } from '../controllers/health.controller';
import { HealthService } from '../services/health.service';
import { ImportService } from '../services/import.service';
import { ImportController } from '../controllers/import.controller';
import { AttachmentModule } from './attachment.module';
import { AccountSymbol } from '../pojo/entities/account-symbol.entity';
import { AccountSymbolController } from '../controllers/account-symbol.controller';
import { AccountSymbolService } from '../services/account-symbol.service';
import { SyncController } from '../controllers/sync.controller';
import { SyncService } from '../services/sync.service';

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
  ],
  controllers: [
    AccountController,
    AccountBookController,
    AccountCategoryController,
    UserController,
    AccountFundController,
    AccountShopController,
    HealthController,
    ImportController,
    AccountSymbolController,
    SyncController,
  ],
  providers: [
    AccountItemService,
    AccountBookService,
    AccountCategoryService,
    UserService,
    UserDataInitService,
    AccountFundService,
    AccountShopService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    HealthService,
    ImportService,
    AccountSymbolService,
    SyncService,
  ],
})
export class AccountModule {}
