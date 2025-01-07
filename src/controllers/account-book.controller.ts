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
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('账本')
@Controller('account/book')
export class AccountBookController {
  constructor(private readonly accountBookService: AccountBookService) {}

  @ApiOperation({ summary: '创建账本' })
  @Post()
  create(@Body() createAccountBookDto: CreateAccountBookDto, @Request() req) {
    return this.accountBookService.create(createAccountBookDto, req.user.sub);
  }

  @ApiOperation({ summary: '获取当前用户的所有账本' })
  @Get()
  findAll(@Request() req) {
    return this.accountBookService.findAll(req.user.sub);
  }

  @ApiOperation({ summary: '获取指定账本详情' })
  @ApiParam({ name: 'id', description: '账本ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.accountBookService.findOne(id, req.user.sub);
  }

  @ApiOperation({ summary: '更新账本信息' })
  @ApiParam({ name: 'id', description: '账本ID' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountBookDto: UpdateAccountBookDto,
    @Request() req,
  ) {
    updateAccountBookDto.id = id;
    return this.accountBookService.update(updateAccountBookDto, req.user.sub);
  }

  @ApiOperation({ summary: '删除账本' })
  @ApiParam({ name: 'id', description: '账本ID' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.accountBookService.remove(id, req.user.sub);
  }
}
