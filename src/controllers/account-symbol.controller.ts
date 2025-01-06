import {
  Controller,
  Post,
  Delete,
  Body,
  Request,
  Patch,
  Param,
} from '@nestjs/common';
import { AccountSymbolService } from '../services/account-symbol.service';
import { QueryAccountSymbolDto } from '../pojo/dto/account-symbol/query-account-symbol.dto';
import { QueryAccountBookSymbolDto } from '../pojo/dto/account-symbol/query-account-book-symbol.dto';
import { UpdateAccountSymbolDto } from '../pojo/dto/account-symbol/update-account-symbol.dto';
import { CreateAccountSymbolDto } from '../pojo/dto/account-symbol/create-account-symbol.dto';

@Controller('account/symbol')
export class AccountSymbolController {
  constructor(private readonly accountSymbolService: AccountSymbolService) {}

  @Post()
  async create(@Body() createDto: CreateAccountSymbolDto, @Request() req) {
    return await this.accountSymbolService.create(createDto, req.user.sub);
  }

  @Post('listByType')
  async findAll(@Body() queryDto: QueryAccountSymbolDto) {
    return await this.accountSymbolService.findAll(
      queryDto.accountBookId,
      queryDto.symbolType,
    );
  }

  @Delete(':id')
  async renmove(@Param('id') id: string) {
    await this.accountSymbolService.remove(id);
    return { success: true };
  }

  @Post('list')
  async findAllGroupByType(@Body() queryDto: QueryAccountBookSymbolDto) {
    return await this.accountSymbolService.findAllGroupByType(
      queryDto.accountBookId,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountSymbolDto,
    @Request() req,
  ) {
    return await this.accountSymbolService.update(id, updateDto, req.user.sub);
  }
}
