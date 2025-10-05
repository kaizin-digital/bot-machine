# Core Concept: The Router

The `Router` is the central hub of your bot. It is responsible for receiving all incoming updates from the Telegram API, figuring out what they mean, and dispatching them to the correct handler, middleware, or `Flow`.

Think of it as the main application object in a web framework like Express.js.

## How it Works

1.  An `update` arrives from Telegram (e.g., a message, a button click).
2.  The `TelegramClient` passes the update to `router.handle(update, client)`.
3.  The router creates an `AppContext` (`ctx`) object for this specific update.
4.  It runs all registered `middleware` in the order they were added.
5.  It checks if the user is currently in a `Flow`. If so, it passes the `ctx` to that `FlowController` to handle.
6.  If not in a flow, it checks the stateless routes (`onCommand`, `onCallbackQuery`, `onText`) for a match.
7.  If a match is found, it executes the corresponding handler.

## Stateless Routes

Stateless routes are for simple, one-off interactions that don't require conversational memory. They are registered directly on the router instance.

### `router.onCommand(pattern, handler)`

Handles slash commands like `/start` or `/help`.

```typescript
router.onCommand('start', async (ctx) => {
  await ctx.reply('Welcome!');
});
```

### `router.onCallbackQuery(pattern, handler)`

Handles button clicks from inline keyboards. The `pattern` is matched against the `callback_data` of the button.

```typescript
router.onCallbackQuery('show_help', async (ctx) => {
  await ctx.answerCallbackQuery(); // Acknowledge the button press
  await ctx.editMessageText('Here is some help text.');
});
```

### `router.onText(pattern, handler)`

Handles any regular text message that isn't a command.

```typescript
router.onText('hello', async (ctx) => {
  await ctx.reply('Hi there!');
});
```

### Pattern Matching with Parameters

All stateless route handlers support Express.js-style colon syntax for named parameters. This allows you to build more flexible routes.

The captured values are placed in `ctx.params`.

```typescript
// Matches callback data like 'delete_item:123' or 'delete_item:abc'
router.onCallbackQuery('delete_item::itemId', async (ctx) => {
  // ctx.params.itemId will be '123' or 'abc'
  const { itemId } = ctx.params;
  await db.items.delete(itemId);
  await ctx.editMessageText(`Item ${itemId} has been deleted.`);
});

// Matches text like 'weather london'
router.onText('weather :city', async (ctx) => {
  const { city } = ctx.params;
  const weather = await getWeather(city);
  await ctx.reply(`The weather in ${city} is ${weather}.`);
});
```

## Stateful Flows

For any conversation that requires multiple steps, you use a `Flow`. You register a `FlowController` with the router.

### `router.addFlow(flowController)`

When a user enters a flow (via `ctx.enterFlow()`), the router saves the flow's name in the user's session. On subsequent updates, the router will see this session data and delegate handling to the corresponding `FlowController` instead of processing stateless routes.

```typescript
const mainFlowController = new FlowController(mainFlow.config, mainFlow.name);
router.addFlow(mainFlowController);
```

## Middleware

Middleware allows you to run code for every single update. This is perfect for cross-cutting concerns.

### `router.use(middleware)`

The most important middleware is `session()`, which is required for `Flows` to work. It loads the user's session from a store before your handlers run and saves it after they complete.

```typescript
// Session middleware is essential for stateful conversations
router.use(session());

// You can also add custom middleware, for example, for logging:
router.use(async (ctx, next) => {
  console.log(`Received update ${ctx.update.update_id} from user ${ctx.from?.id}`);
  await next(); // Pass control to the next middleware or handler
  console.log(`Finished handling update ${ctx.update.update_id}`);
});
```
