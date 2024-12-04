import { Controller, Get } from '@nestjs/common';
import { HealthService } from '../services/health.service';
import { Public } from '../decorators/public';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async check() {
    return await this.healthService.check();
  }
}
