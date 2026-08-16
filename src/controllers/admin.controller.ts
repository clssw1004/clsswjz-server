import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminService } from '../services/admin.service';
import { MaterializeService } from '../services/materialize.service';
import { AdminLoginDto } from '../pojo/dto/admin/admin-login.dto';

@ApiTags('管理台')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly materializeService: MaterializeService,
  ) {}

  @ApiOperation({ summary: '管理员登录' })
  @Public()
  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.username, dto.password);
  }

  @ApiOperation({ summary: '平台概览' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get('overview')
  async overview() {
    return this.adminService.overview();
  }

  @ApiOperation({ summary: '立即触发日志回放落库' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Post('materialize')
  async materialize() {
    return this.materializeService.flush();
  }

  @ApiOperation({ summary: '日志回放状态（已回放/待回放/失败）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get('materialize/status')
  async materializeStatus() {
    return this.adminService.materializeStatus();
  }

  @ApiOperation({
    summary: '重头回放：清空业务表并全量重建（危险操作，仅紧急修复时用）',
  })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Post('materialize/reset')
  async materializeReset() {
    await this.materializeService.reset();
    return this.materializeService.flush();
  }
}
