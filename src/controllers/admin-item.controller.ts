import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminItemService } from '../services/admin-item.service';
import { ItemListQueryDto } from '../pojo/dto/admin/admin-query.dto';

@ApiTags('管理台-账目')
@Controller('admin/items')
export class AdminItemController {
  constructor(private readonly itemService: AdminItemService) {}

  @ApiOperation({ summary: '某账本的分页账目列表' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get()
  list(@Query() query: ItemListQueryDto) {
    return this.itemService.listItems(query.bookId, {
      page: query.page,
      pageSize: query.pageSize,
      type: query.type,
      categoryCodes: query.categoryCodes,
      fundIds: query.fundIds,
      shopCodes: query.shopCodes,
      month: query.month,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @ApiOperation({ summary: '账目详情 + 全部日志（变迁时间线）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.itemService.getItemDetail(id);
  }
}
