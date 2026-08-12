import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminStatsService } from '../services/admin-stats.service';
import {
  CategoriesQueryDto,
  TrendQueryDto,
} from '../pojo/dto/admin/admin-query.dto';

@ApiTags('管理台-报表')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly statsService: AdminStatsService) {}

  @ApiOperation({ summary: '平台收支总览' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get('overview')
  overview() {
    return this.statsService.overview();
  }

  @ApiOperation({ summary: '收支趋势（按日/月）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get('trend')
  trend(@Query() query: TrendQueryDto) {
    return this.statsService.trend({
      granularity: query.granularity,
      from: query.from,
      to: query.to,
    });
  }

  @ApiOperation({ summary: '分类占比' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get('categories')
  categories(@Query() query: CategoriesQueryDto) {
    return this.statsService.categories(query.type);
  }
}
