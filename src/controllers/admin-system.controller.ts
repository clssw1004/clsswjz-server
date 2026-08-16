import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminSystemService } from '../services/admin-system.service';

@ApiTags('管理台-系统')
@Controller('admin/system')
export class AdminSystemController {
  constructor(private readonly systemService: AdminSystemService) {}

  @ApiOperation({ summary: '系统信息（版本/环境/数据库/回放状态）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get('info')
  info() {
    return this.systemService.info();
  }
}
