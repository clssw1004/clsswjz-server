import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AccountItemService } from '../services/account-item.service';
import { CreateAccountItemDto } from '../pojo/dto/account-item/create-account-item.dto';
import { UpdateAccountItemDto } from '../pojo/dto/account-item/update-account-item.dto';
import { QueryAccountItemDto } from '../pojo/dto/account-item/query-account-item.dto';
import { ApiTags, ApiOperation, ApiParam, ApiConsumes } from '@nestjs/swagger';

@ApiTags('账本记录')
@Controller('account/item')
export class AccountController {
  constructor(private readonly accountService: AccountItemService) {}

  @ApiOperation({ summary: '创建账本记录' })
  @ApiConsumes('multipart/form-data')
  @Post()
  @UseInterceptors(FilesInterceptor('attachments'))
  async create(
    @Body() createAccountItemDto: CreateAccountItemDto,
    @UploadedFiles() attachments: Express.Multer.File[],
    @Request() req,
  ) {
    return this.accountService.create(
      {
        ...createAccountItemDto,
        attachments,
      },
      req.user.sub,
    );
  }

  @ApiOperation({ summary: '分页查询账本记录' })
  @Post('list')
  findAll(@Body() queryAccountItemDto: QueryAccountItemDto) {
    return this.accountService.findPage(queryAccountItemDto);
  }

  @ApiOperation({ summary: '获取账本记录详情' })
  @ApiParam({ name: 'id', description: '账本记录ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

  @ApiOperation({ summary: '更新账本记录' })
  @ApiParam({ name: 'id', description: '账本记录ID' })
  @ApiConsumes('multipart/form-data')
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('attachments'))
  async update(
    @Param('id') id: string,
    @Body() updateAccountItemDto: UpdateAccountItemDto,
    @UploadedFiles() attachments: Express.Multer.File[],
    @Request() req,
  ) {
    return this.accountService.update(
      id,
      {
        ...updateAccountItemDto,
        attachments,
      },
      req.user.sub,
    );
  }

  @ApiOperation({ summary: '删除账本记录' })
  @ApiParam({ name: 'id', description: '账本记录ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountService.remove(id);
  }

  @ApiOperation({ summary: '批量创建账本记录' })
  @Post('batch')
  createBatch(
    @Body() createAccountItemDtos: CreateAccountItemDto[],
    @Request() req,
  ) {
    return this.accountService.createBatch(createAccountItemDtos, req.user.sub);
  }

  @ApiOperation({ summary: '批量删除账本记录' })
  @Post('batch-delete')
  async batchDelete(@Body() ids: string[], @Request() req) {
    return this.accountService.batchDelete(ids, req.user.sub);
  }
}
