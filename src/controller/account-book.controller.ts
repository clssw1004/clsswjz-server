import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccountBookService } from '../service/account-book.service';
import { CreateAccountBookDto } from '../pojo/dto/account-book/create-account-book.dto';
import { UpdateAccountBookDto } from '../pojo/dto/account-book/update-account-book.dto';

@Controller('account/book')
export class AccountBookController {
  constructor(private readonly accountBookService: AccountBookService) {}

  @Post()
  create(@Body() createAccountBookDto: CreateAccountBookDto) {
    return this.accountBookService.create(createAccountBookDto);
  }

  @Get()
  findAll() {
    return this.accountBookService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountBookService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountBookDto: UpdateAccountBookDto,
  ) {
    return this.accountBookService.update(id, updateAccountBookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountBookService.remove(id);
  }
}
