import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, string>({
  max: 500,
  ttl: 5 * 60 * 1000,
});

export const setCache = (key: string, value: string) => {
  cache.set(key, value);
};

export const getCache = (key: string) => {
  return cache.get(key) ?? null;
};
