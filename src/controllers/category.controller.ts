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
import { CategoryService } from '../services/category.service';
import { Category } from '../pojo/entities/category.entity';
import { QueryCategoryDto } from '../pojo/dto/category/query-category.dto';
import { CreateCategoryDto } from 'src/pojo/dto/category/create-category.dto';

@Controller('account/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

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
  update(@Param('id') id: string, @Body() category: Partial<Category>) {
    return this.categoryService.update(id, category);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
