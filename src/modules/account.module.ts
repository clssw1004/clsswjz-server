import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from '../services/account-item.service';
import { AccountBookService } from '../services/account-book.service';
import { AccountController } from '../controllers/account-item.controller';
import { AccountBookController } from '../controllers/account-book.controller';
import { CategoryController } from '../controllers/category.controller';
import { CategoryService } from '../services/category.service';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { Category } from '../pojo/entities/category.entity';
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
import { AccountBookFund } from '../pojo/entities/account-book-fund.entity';
import { UserDataInitService } from '../services/user-data-init.service';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountShopController } from '../controllers/account-shop.controller';
import { AccountShopService } from '../services/account-shop.service';
import { HealthController } from '../controllers/health.controller';
import { HealthService } from '../services/health.service';
import { ImportService } from '../services/import.service';
import { ImportController } from '../controllers/import.controller';
import { AttachmentModule } from './attachment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountItem,
      AccountBook,
      Category,
      User,
      AccountBookUser,
      AccountFund,
      AccountBookFund,
      AccountShop,
    ]),
    AttachmentModule,
  ],
  controllers: [
    AccountController,
    AccountBookController,
    CategoryController,
    UserController,
    AccountFundController,
    AccountShopController,
    HealthController,
    ImportController,
  ],
  providers: [
    AccountService,
    AccountBookService,
    CategoryService,
    UserService,
    UserDataInitService,
    AccountFundService,
    AccountShopService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    HealthService,
    ImportService,
  ],
})
export class AccountModule {}
