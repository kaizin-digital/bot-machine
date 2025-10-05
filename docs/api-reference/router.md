# API: Router

`import { Router } from '@bot-machine/core';`

The `Router` is the main class for routing incoming Telegram updates.

## `new Router()`

Creates a new router instance.

```typescript
const router = new Router();
```

## Methods

### `onCommand(pattern, handler)`

Registers a handler for slash commands.

-   **`pattern: string | RegExp`**: A string like `'start'` or `'user::id'`, or a regular expression.
-   **`handler: Handler`**: An async function `(ctx: AppContext) => Promise<void>`.

```typescript
router.onCommand('start', async (ctx) => {
  await ctx.reply('Welcome!');
});

router.onCommand('user::id', async (ctx) => {
  const { id } = ctx.params;
  await ctx.reply(`User ID: ${id}`);
});
```

### `onCallbackQuery(pattern, handler)`

Registers a handler for callback queries from inline keyboards.

-   **`pattern: string | RegExp`**: A string like `'action:confirm'` or a regular expression to match against `callback_data`.
-   **`handler: Handler`**: An async function `(ctx: AppContext) => Promise<void>`.

```typescript
router.onCallbackQuery('confirm_order::orderId', async (ctx) => {
  const { orderId } = ctx.params;
  await ctx.answerCallbackQuery('Order confirmed!');
  await ctx.editMessageText(`Order ${orderId} has been confirmed.`);
});
```

### `onText(pattern, handler)`

Registers a handler for text messages.

-   **`pattern: string | RegExp`**: A string like `'hello :name'` or a regular expression.
-   **`handler: Handler`**: An async function `(ctx: AppContext) => Promise<void>`.

```typescript
router.onText('weather :city', async (ctx) => {
  const { city } = ctx.params;
  // ... fetch weather
  await ctx.reply(`The weather in ${city} is sunny.`);
});
```

### `addFlow(flowController)`

Registers a stateful `FlowController`.

-   **`flowController: FlowController`**: An instance of a `FlowController`.

```typescript
import { FlowController } from '@bot-machine/core';
import { mainFlow } from './flows/main.flow';

const mainFlowController = new FlowController(mainFlow.config, mainFlow.name);
router.addFlow(mainFlowController);
```

### `use(middleware)`

Registers a middleware function to be executed for every update.

-   **`middleware: Middleware`**: An async function `(ctx: AppContext, next: () => Promise<void>) => Promise<void>`.

```typescript
import { session } from '@bot-machine/core';

// Session middleware is required for Flows
router.use(session());

// Custom logging middleware
router.use(async (ctx, next) => {
  console.log('New update received');
  await next();
});
```

### `handle(update, client)`

This is the main entry point for processing an update. You typically call this from your `TelegramClient`'s polling or webhook handler.

-   **`update: Update`**: The update object from `telegram-client`.
-   **`client: TelegramClient`**: The `telegram-client` instance.

```typescript
client.startPolling((update) => {
  router.handle(update, client);
});
```
