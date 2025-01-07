import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Request,
} from '@nestjs/common';
import { AccountFundService } from '../services/account-fund.service';
import { CreateAccountFundDto } from '../pojo/dto/account-fund/create-account-fund.dto';
import { QueryAccountFundDto } from '../pojo/dto/account-fund/query-account-fund.dto';
import { UpdateAccountFundDto } from '../pojo/dto/account-fund/update-account-fund.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('账本资金')
@Controller('account/fund')
export class AccountFundController {
  constructor(private readonly accountFundService: AccountFundService) {}

  @ApiOperation({ summary: '创建资金账户' })
  @Post()
  create(@Body() createFundDto: CreateAccountFundDto, @Request() req) {
    return this.accountFundService.create(createFundDto, req.user.sub);
  }

  @ApiOperation({ summary: '获取账本下的资金账户列表' })
  @Post('bookfunds')
  findByAccountBookId(@Body() query: QueryAccountFundDto, @Request() req) {
    return this.accountFundService.findByAccountBookId(req.user.sub, query);
  }

  @ApiOperation({ summary: '获取资金账户详情' })
  @ApiParam({ name: 'id', description: '资金账户ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.accountFundService.findOne(id, req.user.sub);
  }

  @ApiOperation({ summary: '更新资金账户信息' })
  @ApiParam({ name: 'id', description: '资金账户ID' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountFundDto,
    @Request() req,
  ) {
    return this.accountFundService.update(id, updateDto, req.user.sub);
  }

  @ApiOperation({ summary: '更新资金账户余额' })
  @ApiParam({ name: 'id', description: '资金账户ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: '余额金额',
          example: 1000.5,
        },
      },
    },
  })
  @Patch(':id/balance')
  updateBalance(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Request() req,
  ) {
    return this.accountFundService.updateBalance(id, amount, req.user.sub);
  }
}
