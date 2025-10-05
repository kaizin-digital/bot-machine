# API: Session

This section covers the APIs for session management, which is crucial for creating stateful conversations.

## `session(options?)`

`import { session } from '@bot-machine/core';`

This is the main session middleware. It should be registered with the `Router` using `router.use()`.

-   **`options?: SessionOptions`**: An optional configuration object.
-   **Returns**: A `Middleware` function.

### `SessionOptions`

-   **`store?: ISessionStore`**: An object that implements the `ISessionStore` interface for persisting sessions. If not provided, it defaults to `InMemorySessionStore`, which is not suitable for production.

### Example

```typescript
import { Router, session } from '@bot-machine/core';
import { RedisSessionStore } from './my-redis-store'; // You would implement this

const router = new Router();

// Using the default in-memory store (for development)
router.use(session());

// Using a custom persistent store (for production)
const redisStore = new RedisSessionStore(myRedisClient);
router.use(session({ store: redisStore }));
```

## `ISessionStore`

An interface that defines the contract for a session store, allowing for pluggable persistence backends.

-   **`get(key: string): Promise<Record<string, any> | undefined>`**
    Retrieves a session for a given key (usually the user ID).

-   **`set(key: string, value: Record<string, any>): Promise<void>`**
    Saves or updates a session for a given key.

-   **`delete(key: string): Promise<void>`**
    Deletes a session for a given key. The middleware automatically calls this if the session object becomes empty.

### Example Implementation (Conceptual)

```typescript
import { ISessionStore } from '@bot-machine/core';
import { Redis } from 'ioredis';

class RedisSessionStore implements ISessionStore {
  private readonly redis: Redis;
  private readonly prefix = 'session:';

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<Record<string, any> | undefined> {
    const data = await this.redis.get(`${this.prefix}${key}`);
    return data ? JSON.parse(data) : undefined;
  }

  async set(key: string, value: Record<string, any>): Promise<void> {
    await this.redis.set(`${this.prefix}${key}`, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(`${this.prefix}${key}`);
  }
}
```
