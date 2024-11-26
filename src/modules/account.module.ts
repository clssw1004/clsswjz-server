import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from '../service/account.service';
import { AccountController } from '../controllers/account.controller';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { Category } from '../pojo/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountItem, Category])],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
