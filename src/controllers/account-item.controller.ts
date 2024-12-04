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
import { AccountService } from '../services/account-item.service';
import { CreateAccountItemDto } from '../pojo/dto/account-item/create-account-item.dto';
import { UpdateAccountItemDto } from '../pojo/dto/account-item/update-account-item.dto';
import { QueryAccountItemDto } from '../pojo/dto/account-item/query-account-item.dto';

@Controller('account/item')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@Body() createAccountItemDto: CreateAccountItemDto, @Request() req) {
    return this.accountService.create(createAccountItemDto, req.user.sub);
  }

  @Post('list')
  findAll(@Body() queryAccountItemDto: QueryAccountItemDto) {
    return this.accountService.findAll(queryAccountItemDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountItemDto: UpdateAccountItemDto,
    @Request() req,
  ) {
    return this.accountService.update(id, updateAccountItemDto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountService.remove(id);
  }
}
