import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { AccountCategoryService } from '../services/account-category.service';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { QueryCategoryDto } from '../pojo/dto/category/query-category.dto';
import { CreateCategoryDto } from '../pojo/dto/category/create-category.dto';

@Controller('account/category')
export class AccountCategoryController {
  constructor(private readonly categoryService: AccountCategoryService) {}

  @Post()
  create(@Body() category: CreateCategoryDto, @Request() req) {
    return this.categoryService.create({ ...category, id: null }, req.user.sub);
  }

  @Get()
  findAll(@Query() query: QueryCategoryDto) {
    return this.categoryService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() category: Partial<AccountCategory>) {
    return this.categoryService.update(id, category);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
