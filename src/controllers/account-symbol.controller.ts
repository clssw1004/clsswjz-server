import {
  Controller,
  Post,
  Delete,
  Query,
  Body,
  Request,
  Patch,
  Param,
} from '@nestjs/common';
import { AccountSymbolService } from '../services/account-symbol.service';
import { QueryAccountSymbolDto } from '../pojo/dto/account-symbol/query-account-symbol.dto';
import { QueryAccountBookSymbolDto } from '../pojo/dto/account-symbol/query-account-book-symbol.dto';
import { UpdateAccountSymbolDto } from '../pojo/dto/account-symbol/update-account-symbol.dto';

@Controller('account/symbol')
export class AccountSymbolController {
  constructor(private readonly accountSymbolService: AccountSymbolService) {}

  @Post('listByType')
  async findAll(@Body() queryDto: QueryAccountSymbolDto) {
    return await this.accountSymbolService.findAll(
      queryDto.accountBookId,
      queryDto.symbolType,
    );
  }

  @Patch(':id')
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
