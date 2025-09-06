import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileCacheService } from '../services/file-cache.service';
import { RedisCacheService } from '../services/redis-cache.service';
import { CacheService } from '../services/cache.service';
import { CacheController } from '../controllers/cache.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [CacheController],
  providers: [
    FileCacheService,
    {
      provide: 'REDIS_CACHE_SERVICE',
      useFactory: (configService: ConfigService) => {
        const cacheType = configService.get('CACHE_TYPE', 'file');
        if (cacheType === 'redis') {
          return new RedisCacheService(configService);
        }
        return null;
      },
      inject: [ConfigService],
    },
    {
      provide: 'CACHE_SERVICE',
      useFactory: (configService: ConfigService, fileCacheService: FileCacheService, redisCacheService: any): CacheService => {
        const cacheType = configService.get('CACHE_TYPE', 'file');
        
        switch (cacheType) {
          case 'redis':
            return redisCacheService;
          case 'file':
          default:
            return fileCacheService;
        }
      },
      inject: [ConfigService, FileCacheService, 'REDIS_CACHE_SERVICE'],
    },
  ],
  exports: [
    'CACHE_SERVICE',
    FileCacheService,
  ],
})
export class CacheModule {}
