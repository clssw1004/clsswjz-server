import { Controller, Get, Delete, Param, Query } from '@nestjs/common';
import { AccountShopService } from '../services/account-shop.service';

@Controller('account/shop')
export class AccountShopController {
  constructor(private readonly accountShopService: AccountShopService) {}

  /**
   * 获取账本下的所有商家
   */
  @Get()
  findAll(@Query('accountBookId') accountBookId: string) {
    return this.accountShopService.findAll(accountBookId);
  }

  /**
   * 获取指定商家信息
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountShopService.findOne(id);
  }

  /**
   * 删除商家
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountShopService.remove(id);
  }
} 