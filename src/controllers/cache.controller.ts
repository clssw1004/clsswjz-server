import { Controller, Get, Post, Delete, Body, Param, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheService } from '../services/cache.service';


@ApiTags('缓存管理')
@Controller('cache')
export class CacheController {
  constructor(
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheService,
  ) { }

  @Post('get')
  @ApiOperation({ summary: '获取缓存值' })
  @ApiResponse({ status: 200, description: '成功获取缓存值' })
  @ApiResponse({ status: 404, description: '缓存不存在' })
  async getCache(@Body('key') key: string) {
    const value = await this.cacheService.get(key);
    return value
  }

  @Post("set")
  @ApiOperation({ summary: '设置缓存值' })
  @ApiResponse({ status: 201, description: '成功设置缓存值' })
  async setCache(@Body() setCacheDto: { key: string, value: string, ttl?: number }) {
    const { key, value, ttl } = setCacheDto;
    await this.cacheService.set(key, value, ttl);
  }

  @Delete(':key')
  @ApiOperation({ summary: '删除缓存' })
  @ApiResponse({ status: 200, description: '成功删除缓存' })
  async deleteCache(@Param('key') key: string) {
    await this.cacheService.delete(key);
    return;
  }

  @Delete()
  @ApiOperation({ summary: '清空所有缓存' })
  @ApiResponse({ status: 200, description: '成功清空所有缓存' })
  async clearCache() {
    await this.cacheService.clear();
    return;
  }

  @Get(':key/exists')
  @ApiOperation({ summary: '检查缓存是否存在' })
  @ApiResponse({ status: 200, description: '检查结果' })
  async checkCacheExists(@Param('key') key: string) {
    const exists = await this.cacheService.exists(key);
    return { key, exists }
  }
}
