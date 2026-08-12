import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminService } from '../services/admin.service';
import { AdminStatsService } from '../services/admin-stats.service';
import {
  AdminListQueryDto,
  PageQueryDto,
} from '../pojo/dto/admin/admin-query.dto';

@ApiTags('管理台-用户')
@Controller('admin/users')
export class AdminUserController {
  constructor(
    private readonly adminService: AdminService,
    private readonly statsService: AdminStatsService,
  ) {}

  @ApiOperation({ summary: '用户分页列表' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get()
  list(@Query() query: AdminListQueryDto) {
    return this.adminService.listUsers(query);
  }

  @ApiOperation({ summary: '用户详情 + 统计' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @ApiOperation({ summary: '该用户的操作日志' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get(':id/logs')
  userLogs(@Param('id') id: string, @Query() query: PageQueryDto) {
    return this.adminService.listUserLogs(id, query);
  }

  @ApiOperation({ summary: '该用户的账本' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get(':id/books')
  userBooks(@Param('id') id: string) {
    return this.statsService.userBooks(id);
  }

  @ApiOperation({ summary: '该用户的记账明细' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get(':id/items')
  userItems(@Param('id') id: string, @Query() query: PageQueryDto) {
    return this.statsService.userItems(id, query);
  }
}
