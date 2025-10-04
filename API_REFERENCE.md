# bot-machine Framework API Reference

This document provides a comprehensive reference for the bot-machine framework API to help developers and AI agents work with the framework correctly.

## Table of Contents
1. [Router](#router)
2. [Flows](#flows)
3. [Context](#context)
4. [Components](#components)
5. [Business Logic](#business-logic)
6. [Keyboard Builder](#keyboard-builder)
7. [Text Formatting](#text-formatting)
8. [Session Management](#session-management)
9. [Utilities](#utilities)

## Router

The router is the main entry point for handling Telegram updates. It supports commands, callback queries, text patterns, and flows.

### Creating a Router
```typescript
import { Router } from './router';

const router = new Router();
```

### Registration Methods

#### `onCommand(pattern: string | RegExp, handler: Handler)`
Registers a handler for slash commands.
```typescript
router.onCommand('start', async (ctx) => {
  await ctx.reply('Welcome!');
});

// With named parameters (using Express-style patterns)
router.onCommand('profile::id', async (ctx) => {
  // ctx.params.id will contain the captured value
  const userId = ctx.params.id;
  await ctx.reply(`Profile for user ${userId}`);
});
```

#### `onCallbackQuery(pattern: string | RegExp, handler: Handler)`
Registers a handler for callback queries from inline keyboards.
```typescript
router.onCallbackQuery('action::id', async (ctx) => {
  // ctx.params.id will contain the captured value
  const actionId = ctx.params.id;
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`Action ${actionId} handled`);
});

// With RegExp
router.onCallbackQuery(/^confirm::(\w+)$/, async (ctx) => {
  const match = ctx.update.callback_query?.data?.match(/^confirm::(\w+)$/);
  if (match) {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`Confirmed: ${match[1]}`);
  }
});
```

#### `onText(pattern: string | RegExp, handler: Handler)`
Registers a handler for text messages.
```typescript
router.onText('hello :name', async (ctx) => {
  // ctx.params.name will contain the captured value
  const name = ctx.params.name;
  await ctx.reply(`Hello, ${name}!`);
});
```

#### `addFlow(flow: FlowController)`
Registers a stateful flow controller.
```typescript
import { mainFlow } from './flows/main.flow';
router.addFlow(mainFlow);
```

#### `use(middleware: Middleware)`
Registers middleware to be executed for every update.
```typescript
import { session } from './session';
router.use(session()); // Session middleware
```

## Flows

Flows implement stateful, multi-step conversations with state machines.

### Creating a Flow

#### `createFlow(name: string, config: FlowConfig)`
Factory function for creating type-safe flows:
```typescript
import { createFlow } from './flow';

export const myFlow = createFlow('myFlowName', {
  // State definitions go here
});
```

### Flow Configuration

A flow configuration is a map of state names to state definitions:
```typescript
{
  'stateName': {
    component: Component,
    onEnter?: BotQuery,
    onAction?: Record<string, ActionHandler>,
    onText?: Record<string, ActionHandler>
  }
}
```

### Flow State Properties

#### `component: Component`
The UI component to render for this state.

#### `onEnter?: BotQuery`
An optional query to execute to fetch data when entering this state. The result is passed to the component as props.

#### `onAction?: Record<string, ActionHandler>`
A map of handlers for callback query actions. The key is a string pattern (e.g., 'action::id') or a RegExp.

#### `onText?: Record<string, ActionHandler>`
A map of handlers for text messages. The key is a string pattern (e.g., ':name') or a RegExp.

### Action Handler Properties

```typescript
interface ActionHandler {
  command: BotCommand;
  nextState?: string | ((result: any) => string);
  refresh?: boolean;
}
```

- `command`: The business logic command to execute
- `nextState`: The next state to transition to (can be a static string or function of the command result)
- `refresh`: If true, re-renders the current state with the command result instead of transitioning

### Example Flow

```typescript
import { createFlow } from '../flow';
import { MyComponent } from './My.component';
import { getMyDataQuery, doSomethingCommand } from '../core/myModule';
import { noopCommand } from '../core/common';

export const exampleFlow = createFlow('example', {
  'start': {
    component: MyComponent,
    onEnter: getMyDataQuery,
    onAction: {
      'continue': {
        command: noopCommand,
        nextState: exampleFlow.states.middle, // Type-safe state reference
      },
    },
  },
  'middle': {
    component: MyComponent,
    onText: {
      ':userInput': {
        command: doSomethingCommand,
        nextState: exampleFlow.states.final,
      },
    },
  },
  'final': {
    component: MyComponent,
    onAction: {
      'restart': {
        command: noopCommand,
        nextState: exampleFlow.states.start,
      },
    },
  },
});
```

### Entering a Flow

From a handler context:
```typescript
await ctx.enterFlow('myFlowName', 'startState');
```

## Context

The context object provides access to the Telegram update, session data, and methods for responding to updates.

### Properties

- `update: Update` - The raw Telegram update object
- `client: TelegramClient` - The Telegram client instance
- `router: Router` - The router instance
- `from: User | undefined` - The user who initiated the update
- `chat: Chat | undefined` - The chat where the update originated
- `session: Record<string, any>` - Session data for the current user
- `state: Record<string, any>` - State for the current request
- `params: Record<string, string>` - Parameters extracted from route patterns

### Methods

#### `async reply(text: string | FormattedText, extra?: any): Promise<Message>`
Sends a new message to the chat.
```typescript
await ctx.reply('Hello, world!');

// With formatting
import { format } from './text';
const message = format(t => [
  t.b('Bold text'),
  ' and regular text',
  t.n(2), // 2 newlines
  t.i('Italic text')
]);
await ctx.reply(message);
```

#### `async editMessageText(text: string | FormattedText, extra?: any): Promise<Message | boolean>`
Edits the text of the message associated with the current update.
```typescript
await ctx.editMessageText('Updated message');
```

#### `async deleteMessage(): Promise<boolean>`
Deletes the message associated with the current update.
```typescript
await ctx.deleteMessage();
```

#### `async answerCallbackQuery(text?: string): Promise<boolean>`
Answers a callback query, typically to dismiss the loading state on a button.
```typescript
await ctx.answerCallbackQuery('Action completed');
```

#### `async enterFlow(flowName: string, initialState?: string): Promise<void>`
Enters a stateful flow.
```typescript
await ctx.enterFlow('myFlowName', 'startState');
```

## Components

Components are functions that render UI based on data. They receive props and return MessagePayload objects.

### Component Type
```typescript
type Component = (props: any) => Promise<MessagePayload>;
```

### MessagePayload Interface
```typescript
interface MessagePayload {
  text: string;
  parse_mode?: "HTML" | "MarkdownV2";
  reply_markup?: {
    inline_keyboard: {
      text: string;
      callback_data: string;
    }[][];
  };
}
```

### Example Component
```typescript
import { MessagePayload, Keyboard } from './types';

export const MyComponent: Component = async (props) => {
  const { title, message, count = 0 } = props;
  
  return {
    text: `<b>${title}</b>\n${message}\n\nCount: ${count}`,
    parse_mode: 'HTML',
    reply_markup: new Keyboard()
      .text('Increment', 'increment')
      .text('Decrement', 'decrement')
      .row()
      .url('Visit Site', 'https://example.com')
      .inline()
  } as MessagePayload;
};
```

## Business Logic

The framework uses Zod for input/output validation of business logic.

### Creating Commands and Queries

#### `createCommand(config)`
Creates a type-safe bot command.
```typescript
import { createCommand } from './core';
import { z } from 'zod';

export const myCommand = createCommand({
  input: z.object({
    userId: z.string(),
    name: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async (input, ctx) => {
    // Business logic here
    return {
      success: true,
      message: `User ${input.name} processed successfully`
    };
  }
});
```

#### `createQuery(config)`
Creates a type-safe bot query.
```typescript
import { createQuery } from './core';
import { z } from 'zod';

export const myQuery = createQuery({
  input: z.void(), // or z.object({}) for no input
  output: z.object({
    data: z.array(z.string()),
  }),
  execute: async (input, ctx) => {
    // Data fetching logic here
    return {
      data: ['item1', 'item2', 'item3']
    };
  }
});
```

## Keyboard Builder

The keyboard builder provides a fluent API for creating Telegram keyboards.

### Inline Keyboard Buttons

- `text(text: string, callback_data: string)` - Standard button that sends a callback query
- `url(text: string, url: string)` - Button that opens a URL
- `login(text: string, login_url: LoginUrl)` - Button for Telegram Login URL
- `switchInline(text: string, query: string)` - Button to switch to a different chat
- `switchInlineCurrent(text: string, query: string)` - Button to insert query in current chat
- `webApp(text: string, web_app: WebAppInfo)` - Button that launches a Web App
- `pay(text: string)` - Pay button for Telegram Payments

### Reply Keyboard Buttons

- `requestContact(text: string)` - Button requesting contact information
- `requestLocation(text: string)` - Button requesting location
- `requestPoll(text: string, type?: "quiz" | "regular")` - Button to create a poll

### Other Methods

- `row()` - Finalizes current row and starts a new one
- `inline()` - Returns an InlineKeyboardMarkup object
- `reply(options?: ...)` - Returns a ReplyKeyboardMarkup object
- `Keyboard.remove(selective?: boolean)` - Static method to remove reply keyboard

### Example
```typescript
import { Keyboard } from './keyboard';

const keyboard = new Keyboard()
  .text('Option 1', 'option1')
  .text('Option 2', 'option2')
  .row()
  .url('Visit Website', 'https://example.com')
  .inline(); // Returns InlineKeyboardMarkup
```

## Text Formatting

The framework provides functions for creating formatted text messages.

### Format Function
```typescript
import { format } from './text';

const message = format(t => [
  t.b('Bold text'),
  ' and regular text',
  t.i('Italic text'),
  t.n(2), // Two newlines
  t.c('Inline code'),
  t.l('Link text', 'https://example.com'),
  t.s('Strikethrough text')
]);
```

### Available Formatting Tools

- `t.b(content)` - Bold
- `t.i(content)` - Italic
- `t.u(content)` - Underline
- `t.s(content)` - Strikethrough
- `t.sp(content)` - Spoiler
- `t.c(content)` - Inline code
- `t.l(text, url)` - Link
- `t.n(count?)` - Newline (defaults to 1)
- `t.p(content)` - Plain text (escaped)

## Session Management

### Session Middleware
```typescript
import { session } from './session';

// Basic session middleware
router.use(session());

// With custom store
import { RedisSessionStore } from './session/redis';
const redisStore = new RedisSessionStore(redisClient);
router.use(session({ store: redisStore }));
```

### Session Properties
The session is available as `ctx.session` and is user-specific, persisted between updates.

## Utilities

### `pathStringToRegex(path: string): RegExp`
Converts Express-like path strings to a regular expression.

Example: `pathStringToRegex('user::id')` returns `/^user:([^:]+)$/`

## Common Patterns and Best Practices

1. Always use the `createFlow` factory function for type safety
2. Use `noopCommand` for simple state transitions without business logic
3. Use `onEnter` queries to fetch data needed by components
4. Use `refresh: true` when you want to update the current state with new data
5. Use functions for `nextState` when the next state depends on command results
6. Always validate input/output with Zod schemas
7. Use the Keyboard builder for creating inline keyboards
8. Use the format function for rich text messages