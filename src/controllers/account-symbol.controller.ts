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
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('账本属性')
@Controller('account/symbol')
export class AccountSymbolController {
  constructor(private readonly accountSymbolService: AccountSymbolService) {}

  @ApiOperation({ summary: '创建账本属性' })
  @Post()
  async create(@Body() createDto: CreateAccountSymbolDto, @Request() req) {
    return await this.accountSymbolService.create(createDto, req.user.sub);
  }

  @ApiOperation({ summary: '根据类型查询账本属性列表' })
  @Post('listByType')
  async findAll(@Body() queryDto: QueryAccountSymbolDto) {
    return await this.accountSymbolService.findAll(
      queryDto.accountBookId,
      queryDto.symbolType,
    );
  }

  @ApiOperation({ summary: '删除账本属性' })
  @ApiParam({ name: 'id', description: '账本属性ID' })
  @Delete(':id')
  async renmove(@Param('id') id: string) {
    await this.accountSymbolService.remove(id);
    return { success: true };
  }

  @ApiOperation({ summary: '按类型分组获取账本属性列表' })
  @Post('list')
  async findAllGroupByType(@Body() queryDto: QueryAccountBookSymbolDto) {
    return await this.accountSymbolService.findAllGroupByType(
      queryDto.accountBookId,
    );
  }

  @ApiOperation({ summary: '更新账本属性' })
  @ApiParam({ name: 'id', description: '账本属性ID' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountSymbolDto,
    @Request() req,
  ) {
    return await this.accountSymbolService.update(id, updateDto, req.user.sub);
  }
}
