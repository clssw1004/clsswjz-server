import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { BaseCacheService } from './cache.service';

@Injectable()
export class LruCacheService extends BaseCacheService {
  private cache = new LRUCache<string, string>({
    max: 500,
    ttl: 5 * 60 * 1000,
  });

  async get(key: string): Promise<string | null> {
    return this.cache.get(key) ?? null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl !== undefined) {
      this.cache.set(key, value, { ttl });
    } else {
      this.cache.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }
}
