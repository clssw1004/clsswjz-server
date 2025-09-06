import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BaseCacheService } from './cache.service';

@Injectable()
export class RedisCacheService extends BaseCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async onModuleInit() {
    try {
      const redisConfig = {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD'),
        db: this.configService.get<number>('REDIS_DB', 0),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };

      this.redis = new Redis(redisConfig);

      this.redis.on('connect', () => {
        this.logger.log('Redis连接已建立');
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis连接错误', error);
      });

      this.redis.on('close', () => {
        this.logger.warn('Redis连接已关闭');
      });

      // 测试连接
      await this.redis.ping();
      this.logger.log('Redis服务初始化成功');
    } catch (error) {
      this.logger.error('Redis服务初始化失败', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis连接已关闭');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`获取缓存失败: ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`设置缓存失败: ${key}`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`删除缓存失败: ${key}`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      this.logger.error('清空缓存失败', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`检查缓存存在性失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取Redis实例（用于高级操作）
   */
  getRedisInstance(): Redis {
    return this.redis;
  }
}
