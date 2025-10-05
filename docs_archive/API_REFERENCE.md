# Bot-Machine Framework API Reference

This document provides a comprehensive reference for the `bot-machine` framework API. It is designed to help developers and AI agents understand the architecture, components, and best practices for building Telegram bots with this framework.

## Core Concepts

The `bot-machine` framework is built around a few key concepts that work together to manage the bot's logic and state.

1.  **Router:** The central hub that receives all incoming updates from Telegram. It matches updates against registered routes (commands, text patterns, callback queries) and dispatches them to the appropriate handlers. It is the main entry point of your application.

2.  **AppContext (`ctx`):** An object that encapsulates the entire context of a single incoming update. It holds the update payload, a Telegram API client, session data, and helper methods for responding to the user (e.g., `reply`, `editMessageText`). It is passed to every handler and middleware.

3.  **Stateless Handlers:** For simple, one-off interactions, you can register handlers directly on the router (e.g., `router.onCommand('start', ...)`. These are ideal for things like welcome messages or simple commands that don't require conversational state.

4.  **Flows (State Machines):** For complex, multi-step conversations, the framework provides `Flows`. A Flow is a state machine that you define. The `FlowController` manages the user's progression through the states of the flow based on their input. This is the primary mechanism for building rich, stateful interactions.

5.  **Components:** Reusable functions responsible for rendering the UI (the message content and keyboard) for a given state in a Flow. They receive data (`props`) and return a `MessagePayload` object, separating presentation from logic.

6.  **Business Logic (Commands & Queries):** Your application's core logic is encapsulated in `Commands` (actions that change state) and `Queries` (actions that read data). This isolates business logic from the bot's conversational flow and UI, making it reusable and easier to test. `zod` is used to validate the inputs and outputs of these operations.

## 1. Router

The `Router` is the main entry point for handling Telegram updates. It supports commands, callback queries, text patterns, middleware, and stateful flows.

### Creating a Router

```typescript
import { Router } from '@bot-machine/core';

const router = new Router();
```

### Stateless Route Registration

#### `onCommand(pattern: string | RegExp, handler: Handler)`

Registers a handler for slash commands (e.g., `/start`).

-   **Express-style patterns:** You can use named parameters like `:id`. These are captured and made available in `ctx.params`.

```typescript
// Simple command
router.onCommand('start', async (ctx) => {
  await ctx.reply('Welcome!');
});

// Command with named parameters
router.onCommand('user::id', async (ctx) => {
  const userId = ctx.params.id; // 'id' comes from the ':id' part
  await ctx.reply(`Profile for user ${userId}`);
});
```

#### `onCallbackQuery(pattern: string | RegExp, handler: Handler)`

Registers a handler for callback queries from inline keyboards. Also supports Express-style named parameters.

```typescript
router.onCallbackQuery('action::id', async (ctx) => {
  const actionId = ctx.params.id;
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`Action ${actionId} was handled.`);
});
```

#### `onText(pattern: string | RegExp, handler: Handler)`

Registers a handler for general text messages that are not commands.

```typescript
router.onText('hello :name', async (ctx) => {
  const name = ctx.params.name;
  await ctx.reply(`Hello, ${name}!`);
});
```

### Stateful Flow Registration

#### `addFlow(flow: FlowController)`

Registers a stateful `FlowController` instance with the router. The router will delegate updates to the appropriate flow if the user is currently active in one.

```typescript
import { mainFlow } from './flows/main.flow';

const mainFlowController = new FlowController(mainFlow.config, mainFlow.name);
router.addFlow(mainFlowController);
```

### Middleware

#### `use(middleware: Middleware)`

Registers middleware to be executed for every update before the main handlers. Middleware is useful for cross-cutting concerns like session management, logging, or authentication.

```typescript
import { session } from '@bot-machine/core';
import { RedisSessionStore } from './session/redis.store';

// Session middleware is essential for Flows to work
router.use(session({
  store: new RedisSessionStore(redisClient)
}));
```

## 2. AppContext (`ctx`)

The `AppContext` object is passed to every handler and provides access to the update, session, and response methods.

### Key Properties

-   `update: Update`: The raw Telegram update object.
-   `client: TelegramClient`: The underlying Telegram client for making direct API calls.
-   `from: User | undefined`: The user who initiated the update.
-   `chat: Chat | undefined`: The chat where the update originated.
-   `session: Record<string, any>`: A key-value object for persisting data for the current user across multiple updates. **Requires session middleware.**
-   `params: Record<string, string>`: An object containing named parameters extracted from the matched route pattern.

### Core Methods

-   `async reply(text: string | FormattedText, extra?: any)`: Sends a new message.
-   `async editMessageText(text: string | FormattedText, extra?: any)`: Edits the message from which a callback query originated.
-   `async deleteMessage()`: Deletes the message associated with the update.
-   `async answerCallbackQuery(text?: string)`: Acknowledges a callback query, removing the "loading" state from the button.
-   `async enterFlow(flowName: string, initialState?: string)`: Transitions the user into a specific state machine (Flow).

## 3. Flows (State Machines)

Flows are the heart of conversational logic. They are defined as a collection of states, with transitions triggered by user actions.

### Creating a Flow with `createFlow`

The `createFlow` factory function is the recommended way to define a flow. It provides type safety, ensuring that state names are valid and preventing typos.

```typescript
import { createFlow } from '@bot-machine/core';
import { MyComponent } from './My.component';
import { myQuery, myCommand } from '../logic/myModule';

export const exampleFlow = createFlow('exampleFlow', {
  // 1. Define all states here
  start: {
    component: MyComponent,
    onEnter: myQuery, // Fetch data when entering this state
    onAction: {
      'continue': {
        command: noopCommand, // A built-in command that does nothing
        nextState: 'middle', // Go to the 'middle' state
      },
    },
  },
  middle: {
    component: AnotherComponent,
    onText: {
      ':userInput': { // Capture any text input
        command: myCommand,
        // The next state is determined by the result of myCommand
        nextState: (result) => (result.isComplete ? 'final' : 'middle'),
      },
    },
  },
  final: {
    component: FinalComponent,
    onAction: {
      'restart': {
        command: noopCommand,
        // Use the type-safe states object
        nextState: exampleFlow.states.start,
      },
    },
  },
});

// Access states in a type-safe way
const startState = exampleFlow.states.start; // "start"
```

### Flow State Definition

Each state in a flow is an object with the following properties:

-   `component: Component`: (Required) The function that renders the message for this state.
-   `onEnter?: BotQuery`: An optional `Query` that runs when the user enters this state. Its return value is passed as `props` to the `component`.
-   `onAction?: Record<string, ActionHandler>`: A map of handlers for `callback_query` data. The key is a pattern to match.
-   `onText?: Record<string, ActionHandler>`: A map of handlers for text messages.

### Action Handler

An `ActionHandler` defines what happens when a user interacts with a message in a given state.

-   `command: BotCommand`: The business logic to execute.
-   `nextState?: string | ((result: any) => string)`: The next state to transition to. Can be a static string or a function that computes the next state from the command's result. If omitted, the flow exits.
-   `refresh?: boolean`: If `true`, the flow re-renders the *current* state instead of transitioning. This is useful for updating the UI without changing the state (e.g., incrementing a counter).

## 4. Components

Components are responsible for presentation. They are async functions that receive `props` (from an `onEnter` query) and return a `MessagePayload`.

```typescript
import { MessagePayload, Keyboard } from '@bot-machine/core';

// The props are the result of the onEnter query for the state
export const CounterComponent = async (props: { count: number }) => {
  const { count } = props;

  const text = `<b>Counter: ${count}</b>`;

  const keyboard = new Keyboard()
    .text('Increment', 'increment')
    .text('Decrement', 'decrement')
    .row()
    .text('Exit', 'exit');

  return {
    text,
    parse_mode: 'HTML',
    reply_markup: keyboard.inline(),
  };
};
```

## 5. Business Logic: Commands & Queries

Isolate your application's logic from the conversational flow using `Commands` and `Queries`. They are defined with `zod` schemas for automatic input and output validation.

### `createQuery`

Used for read-only operations, like fetching data from a database.

```typescript
import { createQuery } from '@bot-machine/core';
import { z } from 'zod';

export const getUserProfileQuery = createQuery({
  input: z.object({ userId: z.string() }),
  output: z.object({ name: z.string(), email: z.string() }),
  execute: async ({ userId }) => {
    // Fetch user from database...
    const user = await db.users.find(userId);
    return { name: user.name, email: user.email };
  },
});
```

### `createCommand`

Used for operations that modify state (write operations).

```typescript
import { createCommand } from '@bot-machine/core';
import { z } from 'zod';

export const updateUserNameCommand = createCommand({
  input: z.object({ userId: z.string(), newName: z.string() }),
  output: z.object({ success: z.boolean() }),
  execute: async ({ userId, newName }) => {
    // Update user in database...
    await db.users.update(userId, { name: newName });
    return { success: true };
  },
});
```

## 6. Keyboard Builder

A fluent API for creating `InlineKeyboardMarkup` and `ReplyKeyboardMarkup`.

```typescript
import { Keyboard } from '@bot-machine/core';

// Inline Keyboard
const inlineKeyboard = new Keyboard()
  .text('Button 1', 'callback_data_1')
  .url('Open Google', 'https://google.com')
  .row() // Start a new row
  .text('Button 3', 'callback_data_3')
  .inline(); // Build the InlineKeyboardMarkup

// Reply Keyboard
const replyKeyboard = new Keyboard()
  .requestContact('Share Contact')
  .requestLocation('Share Location')
  .reply({ resize_keyboard: true, one_time_keyboard: true });

// Remove Reply Keyboard
const removeKeyboard = Keyboard.remove();
```

## 7. Text Formatting

A simple and safe HTML-based text formatter.

```typescript
import { format } from '@bot-machine/core';

const message = format(t => [
  t.b('Hello!'), // Bold
  t.n(2), // 2 newlines
  'This is a message with ',
  t.i('italic'), // Italic
  ' and ',
  t.l('a link', 'https://example.com'), // Link
  '.',
  t.c('const x = 10;'), // Inline code
]);

// `message` is a FormattedText object with `text` and `parseMode` properties.
await ctx.reply(message);
```

## 8. Session Management

Session management is crucial for `Flows`. The `session` middleware adds `ctx.session`.

-   **`InMemorySessionStore`**: The default, for development only.
-   **Custom Stores**: For production, you must provide a persistent store (e.g., Redis, a database) by implementing the `ISessionStore` interface.

### `ISessionStore` Interface

```typescript
export interface ISessionStore {
  get(key: string): Promise<Record<string, any> | undefined>;
  set(key: string, value: Record<string, any>): Promise<void>;
  delete(key: string): Promise<void>;
}
```
