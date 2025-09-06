import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { BaseCacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileCacheService extends BaseCacheService {
  private readonly logger = new Logger(FileCacheService.name);
  private readonly cacheDir: string;
  private readonly cacheData: Map<string, { value: string; expires?: number }> = new Map();

  constructor(private readonly configService: ConfigService) {
    super();
    // 使用DATA_PATH环境变量，默认为data目录
    const dataPath = this.configService.get('DATA_PATH', 'data');
    this.cacheDir = join(process.cwd(), dataPath, 'cache');
    this.initializeCacheDir();
    this.loadCacheFromDisk();
  }

  /**
   * 获取缓存文件路径
   * @returns 缓存文件的完整路径
   */
  private getCacheFilePath(): string {
    return join(this.cacheDir, 'cache.json');
  }

  private async initializeCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      this.logger.error('创建缓存目录失败', error);
    }
  }

  private async loadCacheFromDisk(): Promise<void> {
    try {
      const cacheFile = this.getCacheFilePath();
      const data = await fs.readFile(cacheFile, 'utf-8');
      const cacheData = JSON.parse(data);

      // 检查过期时间，只加载未过期的数据
      const now = Date.now();
      for (const [key, item] of Object.entries(cacheData)) {
        const cacheItem = item as { value: string; expires?: number };
        if (!cacheItem.expires || cacheItem.expires > now) {
          this.cacheData.set(key, cacheItem);
        }
      }

      this.logger.log(`从磁盘加载了 ${this.cacheData.size} 个缓存项`);
    } catch (error) {
      // 文件不存在或读取失败，忽略错误
      this.logger.debug('缓存文件不存在或读取失败，将创建新的缓存');
    }
  }

  private async saveCacheToDisk(): Promise<void> {
    try {
      const cacheFile = this.getCacheFilePath();
      const cacheData = Object.fromEntries(this.cacheData);
      await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      this.logger.error('保存缓存到磁盘失败', error);
    }
  }

  private isExpired(item: { value: string; expires?: number }): boolean {
    if (!item.expires) return false;
    return Date.now() > item.expires;
  }

  async get(key: string): Promise<string | null> {
    const item = this.cacheData.get(key);
    if (!item) return null;

    if (this.isExpired(item)) {
      this.cacheData.delete(key);
      await this.saveCacheToDisk();
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const item: { value: string; expires?: number } = { value };

    if (ttl) {
      item.expires = Date.now() + (ttl * 1000);
    }

    this.cacheData.set(key, item);
    await this.saveCacheToDisk();
  }

  async delete(key: string): Promise<void> {
    this.cacheData.delete(key);
    await this.saveCacheToDisk();
  }

  async clear(): Promise<void> {
    this.cacheData.clear();
    await this.saveCacheToDisk();
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cacheData.get(key);
    if (!item) return false;

    if (this.isExpired(item)) {
      this.cacheData.delete(key);
      await this.saveCacheToDisk();
      return false;
    }

    return true;
  }
}
