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
import { AccountBookService } from '../services/account-book.service';
import { UpdateAccountBookDto } from '../pojo/dto/account-book/update-account-book.dto';
import { CreateAccountBookDto } from '../pojo/dto/account-book/create-account-book.dto';

@Controller('account/book')
export class AccountBookController {
  constructor(private readonly accountBookService: AccountBookService) { }

  @Post()
  create(@Body() createAccountBookDto: CreateAccountBookDto, @Request() req) {
    return this.accountBookService.create(createAccountBookDto, req.user.sub);
  }

  @Get()
  findAll(@Request() req) {
    return this.accountBookService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.accountBookService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountBookDto: UpdateAccountBookDto,
    @Request() req,
  ) {
    updateAccountBookDto.id = id;
    return this.accountBookService.update(updateAccountBookDto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.accountBookService.remove(id, req.user.sub);
  }
}
