# API: Business Logic

This section covers the APIs for creating schema-validated business logic units.

## `createQuery(config)`

`import { createQuery } from '@bot-machine/core';`

A factory function for creating a `BotQuery` (a read-only operation).

-   **`config`**: A configuration object with the following properties:
    -   **`name: string`**: A unique name for the query.
    -   **`input: ZodType`**: A Zod schema for the query's input. Can be `z.void()`, `z.undefined()`, or an empty object `z.object({})` for queries that take no input.
    -   **`output: ZodType`**: A Zod schema for the query's output.
    -   **`execute: (input, ctx) => Promise<output>`**: The async function containing the query's logic. The `input` argument is the parsed input data.
-   **Returns**: A `BotQuery` object.

### Example

```typescript
import { createQuery } from '@bot-machine/core';
import { z } from 'zod';

// Query with input parameters
export const getOrderQuery = createQuery({
  name: "getOrder",
  input: z.object({ orderId: z.string() }),
  output: z.object({ id: z.string(), amount: z.number() }),
  execute: async ({ orderId }, ctx) => {
    const order = await db.orders.find(orderId);
    return order;
  },
});

// Query with no input (using z.void())
export const getCurrentUserQuery = createQuery({
  name: "getCurrentUser",
  input: z.void(),
  output: z.object({ id: z.string(), name: z.string() }),
  execute: async (_, ctx) => {
    const userId = ctx.session.userId;
    const user = await db.users.find(userId);
    return user;
  },
});
```

## `createCommand(config)`

`import { createCommand } from '@bot-machine/core';`

A factory function for creating a `BotCommand` (a write operation).

-   **`config`**: A configuration object with the following properties:
    -   **`name: string`**: A unique name for the command.
    -   **`input: ZodType`**: A Zod schema for the command's input. Can be `z.void()`, `z.undefined()`, or an empty object `z.object({})` for commands that take no input.
    -   **`output: ZodType`**: A Zod schema for the command's output.
    -   **`execute: (input, ctx) => Promise<output>`**: The async function containing the command's logic.
-   **Returns**: A `BotCommand` object.

### Example

```typescript
import { createCommand } from '@bot-machine/core';
import { z } from 'zod';

// Command with input parameters
export const createOrderCommand = createCommand({
  name: "createOrder",
  input: z.object({ userId: z.string(), amount: z.number() }),
  output: z.object({ success: z.boolean(), orderId: z.string() }),
  execute: async ({ userId, amount }, ctx) => {
    const order = await db.orders.create({ userId, amount });
    return { success: true, orderId: order.id };
  },
});

// Command with no input (using an empty object)
export const incrementCounterCommand = createCommand({
  name: "incrementCounter",
  input: z.object({}),
  output: z.object({ count: z.number() }),
  execute: async (_, ctx) => {
    ctx.session.count = (ctx.session.count || 0) + 1;
    return { count: ctx.session.count };
  },
});
```

## `noopCommand`

`import { noopCommand } from '@bot-machine/core';`

A built-in, pre-defined command that takes no input, returns an empty object, and performs no actions. It is useful for state transitions that do not require any business logic.

### Example

```typescript
// In a FlowState definition
onAction: {
  'go_to_next_step': {
    command: noopCommand,
    nextState: 'nextStep',
  }
}
```
