# Core Concept: App Context (`ctx`)

The App Context, almost always referred to as `ctx`, is the most important object in `bot-machine`. It is an object that encapsulates **everything you need** to handle a single update from Telegram.

A new `ctx` is created for every incoming update, and it is passed as the first argument to all middleware, handlers, and business logic functions (`Commands` and `Queries`).

## Key Properties

Think of `ctx` as your toolbox. Here are the most important tools inside it:

-   `ctx.update: Update`
    The raw, unmodified update object directly from the Telegram API. You can access any property of the update here, like `ctx.update.message.text` or `ctx.update.callback_query.data`.

-   `ctx.client: TelegramClient`
    The underlying `TelegramClient` instance. This allows you to make direct, low-level calls to the Telegram API if you need functionality not covered by the context helpers (e.g., `ctx.client.sendSticker(...)`).

-   `ctx.from: User | undefined`
    A convenient shortcut to get the `User` object for the person who sent the message or clicked the button. It's equivalent to `ctx.update.message?.from ?? ctx.update.callback_query?.from`.

-   `ctx.chat: Chat | undefined`
    A shortcut to the `Chat` object where the update originated.

-   `ctx.params: Record<string, string>`
    An object containing any named parameters captured from your route patterns. For a route like `'action::itemId'` and callback data `'action:123'`, `ctx.params.itemId` would be `'123'`.

-   `ctx.session: Record<string, any>`
    The session object for the current user. This is your primary tool for maintaining state across multiple updates. You can read and write any data to it. **This property only works if you have enabled the `session()` middleware.**

    ```typescript
    // In one handler
    ctx.session.counter = (ctx.session.counter ?? 0) + 1;

    // In a later handler
    await ctx.reply(`The counter is now ${ctx.session.counter}`);
    ```

## Core Methods

`ctx` also provides helper methods to respond to the user. These methods are aware of the current context (like the chat ID and message ID), so you don't have to specify them manually.

-   `async ctx.reply(text, extra?)`
    Sends a **new message** to the user. This is the most common response method.

    ```typescript
    await ctx.reply('This is a new message.');
    ```

-   `async ctx.editMessageText(text, extra?)`
    **Edits the existing message** that the user interacted with (e.g., the message that contained the button they just clicked). This is typically used in response to a `callback_query`.

    ```typescript
    // User clicks a button with callback_data 'increment'
    router.onCallbackQuery('increment', async (ctx) => {
      // ... logic ...
      await ctx.editMessageText('The content has been updated!');
    });
    ```

-   `async ctx.answerCallbackQuery(text?)`
    Acknowledges a button press (`callback_query`). You should **always** call this after handling a button click to stop the loading animation on the user's screen. You can optionally provide text to show as a small notification.

    ```typescript
    router.onCallbackQuery('some_action', async (ctx) => {
      await ctx.answerCallbackQuery('Action successful!');
      // ... other logic
    });
    ```

-   `async ctx.deleteMessage()`
    Deletes the message associated with the current update (e.g., the message with the button that was just clicked).

-   `async ctx.enterFlow(flowName, initialState?)`
    This is the gateway to stateful conversations. Calling this method transitions the user into a `Flow`, starting at the `initialState` (which defaults to `'index'`).

    ```typescript
    router.onCommand('register', async (ctx) => {
      await ctx.reply('Starting the registration process...');
      await ctx.enterFlow('registrationFlow');
    });
    ```
