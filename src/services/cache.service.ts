import { Injectable } from '@nestjs/common';

export interface CacheService {
  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值，如果不存在则返回null
   */
  get(key: string): Promise<string | null>;

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒），可选
   */
  set(key: string, value: string, ttl?: number): Promise<void>;

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): Promise<void>;

  /**
   * 清空所有缓存
   */
  clear(): Promise<void>;

  /**
   * 检查键是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  exists(key: string): Promise<boolean>;
}

@Injectable()
export abstract class BaseCacheService implements CacheService {
  abstract get(key: string): Promise<string | null>;
  abstract set(key: string, value: string, ttl?: number): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract clear(): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
}
