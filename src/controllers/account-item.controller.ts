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

@Controller('account/item')
export class AccountController {
  constructor(private readonly accountService: AccountItemService) {}

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

  @Post('list')
  findAll(@Body() queryAccountItemDto: QueryAccountItemDto) {
    return this.accountService.findPage(queryAccountItemDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountService.remove(id);
  }

  @Post('batch')
  createBatch(
    @Body() createAccountItemDtos: CreateAccountItemDto[],
    @Request() req,
  ) {
    return this.accountService.createBatch(createAccountItemDtos, req.user.sub);
  }

  @Post('batch/delete')
  async batchDelete(@Body() ids: string[], @Request() req) {
    return await this.accountService.batchDelete(ids, req.user.sub);
  }
}
