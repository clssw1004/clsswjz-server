import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccountService } from '../services/account-item.service';
import { CreateAccountItemDto } from '../pojo/dto/account-record/create-account-item.dto';
import { UpdateAccountItemDto } from '../pojo/dto/account-record/update-account-item.dto';

@Controller('account/item')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@Body() createAccountItemDto: CreateAccountItemDto) {
    return this.accountService.create(createAccountItemDto);
  }

  @Get()
  findAll() {
    return this.accountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountItemDto: UpdateAccountItemDto,
  ) {
    return this.accountService.update(id, updateAccountItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountService.remove(id);
  }
}
