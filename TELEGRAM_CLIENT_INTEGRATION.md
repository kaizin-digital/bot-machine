# bot-machine Framework: Integration with @bot-machine/telegram-client

This document provides information about how the bot-machine framework integrates with the `@bot-machine/telegram-client` package, which serves as the low-level Telegram API client.

**Note**: This documentation is based on `@bot-machine/telegram-client` version 1.0.0 and above. Ensure you're using the latest version to take advantage of all features and improvements.

## Overview

The bot-machine framework uses `@bot-machine/telegram-client` as its underlying Telegram API client to communicate with the Telegram Bot API. This package handles the low-level HTTP requests and provides TypeScript types for Telegram API objects.

## How the Integration Works

### 1. Core Integration Points

The `@bot-machine/telegram-client` is primarily used in:

- `src/context.ts` - The BotContext class uses the client to send messages, edit messages, etc.
- `src/router.ts` - The router receives the client instance to handle updates
- Various middleware and business logic - for direct API calls if needed

### 2. Client Usage in Context

The Telegram client is available in the context under `ctx.client`:

```typescript
// In a handler or business logic
await ctx.client.sendMessage({
  chat_id: ctx.chat.id,
  text: 'Hello, world!'
});

await ctx.client.editMessageText({
  chat_id: ctx.chat.id,
  message_id: 123,
  text: 'Updated message'
});
```

### 3. Update Object Structure

The `ctx.update` object comes directly from the telegram-client package and follows the Telegram Bot API schema:

```typescript
interface Update {
  update_id: number;
  message?: Message;
  edited_message?: Message;
  channel_post?: Message;
  edited_channel_post?: Message;
  inline_query?: InlineQuery;
  chosen_inline_result?: ChosenInlineResult;
  callback_query?: CallbackQuery;
  shipping_query?: ShippingQuery;
  pre_checkout_query?: PreCheckoutQuery;
  poll?: Poll;
  poll_answer?: PollAnswer;
  my_chat_member?: ChatMemberUpdated;
  chat_member?: ChatMemberUpdated;
  chat_join_request?: ChatJoinRequest;
}
```

### 4. Message and User Objects

The `Message`, `User`, `Chat` interfaces are provided by the telegram-client:

```typescript
// Access user information
const userId = ctx.from?.id;
const userName = ctx.from?.first_name;

// Access chat information
const chatId = ctx.chat?.id;
const chatType = ctx.chat?.type;

// Access message content
const messageText = ctx.update.message?.text;
const messagePhoto = ctx.update.message?.photo;
```

### 5. Direct Client Usage

While the framework provides convenience methods, you can also use the client directly for advanced functionality:

```typescript
// Upload a file
const result = await ctx.client.sendDocument({
  chat_id: ctx.chat.id,
  document: fs.createReadStream('./file.pdf'),
  caption: 'Here is your document'
});

// Get user profile photos
const profilePhotos = await ctx.client.getUserProfilePhotos({
  user_id: ctx.from.id,
  limit: 5
});

// Get chat information
const chat = await ctx.client.getChat({
  chat_id: ctx.chat.id
});
```

### 6. Error Handling

The telegram-client handles API errors and returns appropriate responses:

```typescript
try {
  await ctx.client.sendMessage({
    chat_id: ctx.chat.id,
    text: 'Hello!'
  });
} catch (error) {
  console.error('Failed to send message:', error);
  // Error handling
}
```

### 7. Supported Telegram API Methods

The telegram-client package provides access to most Telegram Bot API methods:

- Message methods: `sendMessage`, `editMessageText`, `deleteMessage`, etc.
- File methods: `sendPhoto`, `sendDocument`, `sendAudio`, etc.
- Game methods: `sendGame`, `setGameScore`, `getGameHighScores`
- Inline methods: `answerInlineQuery`
- Sticker methods: `sendSticker`, `getStickerSet`, etc.
- User/Chat methods: `getUserProfilePhotos`, `getChat`, `getChatMembersCount`, etc.
- Callback methods: `answerCallbackQuery`
- and more...

### 8. Best Practices

#### Use Framework Methods When Possible
While you can use the client directly, prefer framework methods when available:

```typescript
// Preferred approach
await ctx.reply('Hello!');

// Direct client usage (when advanced features are needed)
await ctx.client.sendMessage({ chat_id: ctx.chat.id, text: 'Hello!' });
```

#### Session Integration
The telegram-client is integrated with the session system to maintain state across requests:

```typescript
// Session data is automatically loaded/saved
ctx.session.userData = { lastCommand: '/start', timestamp: Date.now() };
```

#### Type Safety
Use the types provided by the telegram-client package:

```typescript
import type { Update, Message, User, Chat, TelegramClient } from "@bot-machine/telegram-client";

// These are already available in ctx.update, ctx.from, ctx.chat
```

This integration allows the bot-machine framework to provide a high-level, declarative API while still allowing access to the full power of the Telegram Bot API through the client package.