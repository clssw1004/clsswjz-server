import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminService } from '../services/admin.service';
import { AdminLogQueryDto } from '../pojo/dto/admin/admin-query.dto';

@ApiTags('管理台-日志')
@Controller('admin/logs')
export class AdminLogController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: '日志审计列表（多条件过滤）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get()
  list(@Query() query: AdminLogQueryDto) {
    return this.adminService.listLogs(query);
  }

  @ApiOperation({ summary: '单条日志详情' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.adminService.getLogDetail(id);
  }
}
