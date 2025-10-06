# Core Concept: Business Logic

In `bot-machine`, your application's core logic is cleanly separated from the conversational flow and UI. This logic is organized into two types of units: **Queries** and **Commands**.

This separation is a powerful architectural pattern that makes your code more modular, reusable, and easier to test.

## Queries

A **Query** is a **read-only** operation. Its job is to fetch data from a source like a database, an external API, or the user's session.

-   **When to use:** Use a Query in a `Flow` state's `onEnter` property to get the data needed to render the UI.
-   **Analogy:** A `GET` request in a REST API.

### Defining a Query

You define a Query using the `createQuery` factory function. It requires you to specify the `name`, `input` and `output` schemas using **Zod**.

```typescript
import { createQuery } from '@bot-machine/core';
import { z } from 'zod';

// A query to fetch a user's profile from a database
export const getUserProfileQuery = createQuery({
  name: "getUserProfile",
  // Input schema: what the query needs to run
  input: z.object({ userId: z.string() }),

  // Output schema: what the query is guaranteed to return
  output: z.object({
    name: z.string(),
    email: z.string().email(),
    createdAt: z.date(),
  }),

  // The actual logic
  execute: async ({ userId }, ctx) => {
    // `userId` is guaranteed to be a string
    const user = await db.users.find(userId);
    // The return value will be automatically validated against the output schema
    return user;
  },
});
```

#### Queries without Input

Sometimes you need queries that don't take any input parameters. You can define these using `z.void()`, `z.undefined()`, or `z.object({})`:

```typescript
import { createQuery } from '@bot-machine/core';
import { z } from 'zod';

// A query that fetches data based on session context
export const getCurrentUserQuery = createQuery({
  name: "getCurrentUser",
  input: z.void(), // No input required
  output: z.object({ id: z.string(), name: z.string() }),
  execute: async (_, ctx) => {
    // Input will be undefined
    const userId = ctx.session.userId;
    const user = await db.users.find(userId);
    return user;
  },
});
```

## Commands

A **Command** is a **write** operation. Its job is to change the state of the system, such as updating a database, calling a state-changing API, or modifying the user's session.

-   **When to use:** Use a Command in a `Flow` state's `onAction` or `onText` handlers to process user input and perform an action.
-   **Analogy:** A `POST`, `PUT`, or `DELETE` request in a REST API.

### Defining a Command

You define a Command using the `createCommand` factory function, which also requires a `name` and Zod schemas for `input` and `output`.

```typescript
import { createCommand } from '@bot-machine/core';
import { z } from 'zod';

// A command to update a user's name
export const updateUserNameCommand = createCommand({
  name: "updateUserName",
  // Input schema: what the command needs
  input: z.object({
    userId: z.string(),
    newName: z.string().min(1),
  }),

  // Output schema: what the command returns after completion
  output: z.object({ success: z.boolean() }),

  // The actual logic
  execute: async ({ userId, newName }, ctx) => {
    // `userId` and `newName` are guaranteed to match the input schema
    await db.users.update(userId, { name: newName });
    // The return value must be `{ success: boolean }`
    return { success: true };
  },
});
```

#### Commands without Input

Sometimes you need commands that don't take any input parameters. You can define these using `z.void()`, `z.undefined()`, or `z.object({})`:

```typescript
import { createCommand } from '@bot-machine/core';
import { z } from 'zod';

// A command that performs an action based on session context
export const incrementCounterCommand = createCommand({
  name: "incrementCounter",
  input: z.object({}), // No specific input required, will receive empty object
  output: z.object({ count: z.number() }),
  execute: async (_, ctx) => {
    // Input will be an empty object {}
    ctx.session.count = (ctx.session.count || 0) + 1;
    return { count: ctx.session.count };
  },
});
```

## The Schema-First Contract

Using `createQuery` and `createCommand` with Zod schemas is the cornerstone of `bot-machine`'s **schema-first** design.

-   **Validation:** The framework automatically validates the data you provide to a command/query and the data it returns. If the data doesn't match the schema, the framework will throw an error, preventing invalid data from propagating through your system. This includes validation of both input and output.
-   **Type Safety & Autocompletion:** Because the schemas are defined, TypeScript knows the exact types for the `input` of your `execute` function and what you are expected to return. This provides excellent autocompletion and compile-time safety.
-   **Documentation as Code:** The schemas serve as clear, machine-readable documentation for what each piece of business logic does. An AI agent or another developer can instantly understand how to use your command or query just by looking at its definition.
-   **Flexible Input Handling:** The framework supports various input schemas including `z.void()`, `z.undefined()`, and `z.object({})` for operations that don't require specific input parameters.

This approach enforces a clean separation of concerns and makes your bot's architecture incredibly robust and predictable.
