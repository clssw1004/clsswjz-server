import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from '../service/account-item.service';
import { AccountBookService } from '../service/account-book.service';
import { AccountController } from '../controller/account-item.controller';
import { AccountBookController } from '../controller/account-book.controller';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { Category } from '../pojo/entities/category.entity';
import { AccountBook } from 'src/pojo/entities/account-book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountItem, Category, AccountBook])],
  controllers: [AccountController, AccountBookController],
  providers: [AccountService, AccountBookService],
})
export class AccountModule {}
