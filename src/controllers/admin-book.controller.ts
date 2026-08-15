import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminBookService } from '../services/admin-book.service';
import { BookListQueryDto } from '../pojo/dto/admin/admin-maintenance.dto';

@ApiTags('管理台-账本')
@Controller('admin/books')
export class AdminBookController {
  constructor(private readonly bookService: AdminBookService) {}

  @ApiOperation({ summary: '账本分页列表' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get()
  list(@Query() query: BookListQueryDto) {
    return this.bookService.listBooks({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword,
    });
  }

  @ApiOperation({ summary: '账本详情（成员关系 + 数据规模）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.bookService.getBookDetail(id);
  }
}
