import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccountService } from '../service/account.service';
import { CreateAccountItemDto } from '../pojo/dto/account/create-account-item.dto';
import { UpdateAccountItemDto } from '../pojo/dto/account/update-account-item.dto';

@Controller('account/record')
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
