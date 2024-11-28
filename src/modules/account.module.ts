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
import { JwtAuthGuard } from 'src/guards/auth.guard';
@Module({
  imports: [
    TypeOrmModule.forFeature([AccountItem, AccountBook, Category, User]),
  ],
  controllers: [
    AccountController,
    AccountBookController,
    CategoryController,
    UserController,
  ],
  providers: [
    AccountService,
    AccountBookService,
    CategoryService,
    UserService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AccountModule {}
