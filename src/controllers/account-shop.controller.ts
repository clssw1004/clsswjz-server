import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Query,
  Request,
  Patch,
} from '@nestjs/common';
import { AccountShopService } from '../services/account-shop.service';
import { CreateAccountShopDto } from '../pojo/dto/account-shop/create-account-shop.dto';
import { UpdateAccountShopDto } from '../pojo/dto/account-shop/update-account-shop.dto';

@Controller('account/shop')
export class AccountShopController {
  constructor(private readonly accountShopService: AccountShopService) {}

  @Post()
  async create(@Body() createDto: CreateAccountShopDto, @Request() req) {
    return await this.accountShopService.create(createDto, req.user.sub);
  }

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

  /**
   * 更新商家信息
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountShopDto,
    @Request() req,
  ) {
    return await this.accountShopService.update(id, updateDto, req.user.sub);
  }
}
