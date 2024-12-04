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
import { CreateAccountFundDto } from '../pojo/dto/account-fund/create-account-fund.dto';
import { QueryAccountFundDto } from '../pojo/dto/account-fund/query-account-fund.dto';
import { UpdateAccountFundDto } from '../pojo/dto/account-fund/update-account-fund.dto';

@Controller('account/fund')
export class AccountFundController {
  constructor(private readonly accountFundService: AccountFundService) {}

  @Post()
  create(@Body() createFundDto: CreateAccountFundDto, @Request() req) {
    return this.accountFundService.create(createFundDto, req.user.sub);
  }

  @Get('list')
  findAll(@Request() req) {
    return this.accountFundService.findAll(req.user.sub);
  }

  @Post('bookfunds')
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
    @Body() updateDto: UpdateAccountFundDto,
    @Request() req,
  ) {
    return this.accountFundService.update(id, updateDto, req.user.sub);
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
