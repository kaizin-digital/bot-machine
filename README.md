# Bot-Machine

A lightweight and modern framework for building Telegram bots, inspired by Express.js and React, and designed for AI-driven development.

**[➡️ Go to the full documentation](./docs/README.md)**

## Overview

`bot-machine` provides a highly structured, predictable, and scalable environment for bot development. Its core features are:

-   **Schema-First Architecture:** Business logic is defined with Zod schemas, providing strong typing and runtime validation.
-   **Type-Safe State Machines:** Conversational flows are built with a type-safe API that prevents common errors.
-   **Component-Based UI:** UI rendering is separated from logic, inspired by React.
-   **Express-style Routing:** A familiar routing pattern for handling commands, callbacks, and text messages.

## Installation

```bash
bun install @bot-machine/core @bot-machine/telegram-client zod
```

## Quick Start

This example creates a simple bot that asks for your name and greets you.

```typescript
import { TelegramClient } from '@bot-machine/telegram-client';
import { Router, session, createFlow, createCommand } from '@bot-machine/core';
import { z } from 'zod';

// 1. Initialize the client and router
const client = new TelegramClient(process.env.BOT_TOKEN!);
const router = new Router();

// 2. Use session middleware (required for flows)
router.use(session());

// 3. Create a command to enter the flow
router.onCommand('start', async (ctx) => {
  await ctx.reply('Let\'s begin!');
  await ctx.enterFlow('welcome');
});

// 4. Define the conversational flow
const welcomeFlow = createFlow('welcome', {
  index: {
    component: async () => ({ text: 'What is your name?' }),
    onText: {
      ':name': {
        command: createCommand({
          input: z.object({ name: z.string() }),
          output: z.object({ greeting: z.string() }),
          execute: async ({ name }) => ({ greeting: `Hello, ${name}!` }),
        }),
        nextState: 'greet',
      },
    },
  },
  greet: {
    component: async (props: { greeting: string }) => ({ text: props.greeting }),
  },
});

// 5. Register the flow
router.addFlow(welcomeFlow);

// 6. Start the bot
console.log('Bot starting...');
client.startPolling((update) => {
  router.handle(update, client);
});
```

## Learn More

To learn more about the concepts and the full API, please visit the **[main documentation](./docs/README.md)**.
