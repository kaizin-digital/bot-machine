
import type { ISessionStore } from '../types';
import type { RedisClientType } from 'redis';

/**
 * Configuration options for the Redis session store.
 */
export interface RedisSessionStoreOptions {
  /**
   * A prefix for all session keys stored in Redis.
   * Defaults to 'session'.
   */
  prefix?: string;
}

/**
 * A session store that persists session data in a Redis database.
 */
export class RedisSessionStore implements ISessionStore {
  private readonly client: RedisClientType<any, any, any>;
  private readonly prefix: string;

  /**
   * Creates a new RedisSessionStore.
   * @param client An already-connected `redis` client instance.
   * @param options Configuration options for the store.
   */
  constructor(client: RedisClientType<any, any, any>, options?: RedisSessionStoreOptions) {
    this.client = client;
    this.prefix = options?.prefix ?? 'session';
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /** @inheritdoc */
  async get(key: string): Promise<Record<string, any> | undefined> {
    const redisKey = this.getKey(key);
    const data = await this.client.get(redisKey);
    if (!data) {
      return undefined;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing session data from Redis:', e);
      return undefined;
    }
  }

  /** @inheritdoc */
  async set(key: string, value: Record<string, any>): Promise<void> {
    const redisKey = this.getKey(key);
    try {
      const data = JSON.stringify(value);
      await this.client.set(redisKey, data);
    } catch (e) {
      console.error('Error serializing session data to Redis:', e);
    }
  }

  /** @inheritdoc */
  async delete(key: string): Promise<void> {
    const redisKey = this.getKey(key);
    await this.client.del(redisKey);
  }
}
