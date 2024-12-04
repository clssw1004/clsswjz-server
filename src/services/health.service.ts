import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../pojo/entities/user.entity';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async check() {
    const startTime = process.uptime();
    const memoryUsage = process.memoryUsage();
    let dbStatus = 'healthy';

    // 检查数据库连接
    try {
      await this.userRepository.query('SELECT 1');
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(startTime),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      },
      database: {
        status: dbStatus,
      },
    };
  }
}
