import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { AccountFundService } from '../services/account-fund.service';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { CreateAccountFundDto } from '../pojo/dto/account-fund/create-account-fund.dto';
import { QueryAccountFundDto } from '../pojo/dto/account-fund/query-account-fund.dto';

@Controller('account/fund')
export class AccountFundController {
  constructor(private readonly accountFundService: AccountFundService) {}

  @Post()
  create(@Body() createFundDto: CreateAccountFundDto, @Request() req) {
    return this.accountFundService.create(createFundDto, req.user.sub);
  }

  @Post('list')
  findByAccountBookId(@Body() query: QueryAccountFundDto, @Request() req) {
    return this.accountFundService.findByAccountBookId(req.user.sub, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.accountFundService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFundDto: Partial<AccountFund>,
    @Request() req,
  ) {
    return this.accountFundService.update(id, updateFundDto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.accountFundService.remove(id, req.user.sub);
  }

  @Patch(':id/balance')
  updateBalance(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Request() req,
  ) {
    return this.accountFundService.updateBalance(id, amount, req.user.sub);
  }
}
