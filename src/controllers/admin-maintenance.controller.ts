import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminMaintenanceService } from '../services/admin-maintenance.service';
import {
  MaintenanceDeleteDto,
  MaintenanceListQueryDto,
  MaintenanceMergeDto,
  MaintenanceRenameDto,
} from '../pojo/dto/admin/admin-maintenance.dto';

@ApiTags('管理台-批量维护')
@Controller('admin/maintenance')
export class AdminMaintenanceController {
  constructor(private readonly maintenanceService: AdminMaintenanceService) {}

  @ApiOperation({ summary: '某账本的数据字典列表（分类/商户/标签，含引用笔数）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get('entities')
  list(@Query() query: MaintenanceListQueryDto) {
    return this.maintenanceService.listEntities(query.bookId, query.type);
  }

  @ApiOperation({ summary: '批量重命名（日志驱动）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Post('rename')
  rename(@Body() dto: MaintenanceRenameDto) {
    return this.maintenanceService.rename(dto);
  }

  @ApiOperation({ summary: '批量删除（日志驱动）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Post('delete')
  delete(@Body() dto: MaintenanceDeleteDto) {
    return this.maintenanceService.delete(dto);
  }

  @ApiOperation({ summary: '批量合并：账目引用重定向 + 删除源（日志驱动）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Post('merge')
  merge(@Body() dto: MaintenanceMergeDto) {
    return this.maintenanceService.merge(dto);
  }
}
