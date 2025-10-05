# Getting Started

This guide will walk you through building your first bot with `bot-machine`. We will create a simple bot that asks for your name and then greets you.

## Prerequisites

- You have [Node.js](https://nodejs.org/) and [Bun](https://bun.sh/) installed.
- You have a Telegram Bot Token. You can get one by talking to [@BotFather](https://t.me/BotFather) on Telegram.

## 1. Project Setup

First, let's set up a new project.

```bash
# Create a new directory
mkdir my-bot
cd my-bot

# Initialize a new project
bun init -y

# Install the necessary packages
bun install @bot-machine/core @bot-machine/telegram-client zod
```

Now, create a file named `index.ts` and add the following code to set up your bot token. **Remember to replace `'YOUR_BOT_TOKEN'` with your actual token.**

```typescript
// index.ts
import { TelegramClient } from '@bot-machine/telegram-client';

// 1. Initialize the Telegram Client
const client = new TelegramClient('YOUR_BOT_TOKEN');

// We will add more code here...
```

## 2. Create the Router

The `Router` is the main entry point for all updates from Telegram. It's similar to an Express.js app.

Let's also add the `session` middleware. The session is essential for `Flows` to store state between messages.

```typescript
// index.ts (continued)
import { Router, session } from '@bot-machine/core';

// ... client initialization

// 2. Create a router
const router = new Router();

// 3. Use the session middleware (important for flows)
router.use(session());
```

## 3. Create a Simple Command

Let's add a stateless `/start` command to make sure everything is working.

```typescript
// index.ts (continued)

// ... router and session setup

// 4. Register a simple command handler
router.onCommand('start', async (ctx) => {
  // ctx.reply sends a message back to the user
  await ctx.reply('Hello, world! Let\'s start the flow.');
  // We can now enter a flow
  await ctx.enterFlow('welcome');
});
```

## 4. Define the Conversational Flow

Now for the fun part. We will define a multi-step conversation (a `Flow`) to ask for the user's name.

`Flows` are state machines. We will define two states: `index` (to ask the question) and `greet` (to show the result).

```typescript
// index.ts (continued)
import { createFlow, createCommand } from '@bot-machine/core';
import { z } from 'zod';

// ... after router.onCommand

// 5. Define a Flow (a state machine for conversation)
const welcomeFlow = createFlow('welcome', {
  // The first state: 'index'
  index: {
    // A component is a function that renders the message
    component: async (props) => ({
      text: 'Welcome! What is your name?',
    }),
    // onText handles the user's text reply
    onText: {
      // ':name' is a pattern that captures the user's input into ctx.params.name
      ':name': {
        // A command encapsulates our business logic
        command: createCommand({
          input: z.object({ name: z.string() }),
          output: z.object({ greeting: z.string() }),
          execute: async ({ name }) => {
            return { greeting: `Hello, ${name}!` };
          },
        }),
        // After the command, transition to the 'greet' state
        nextState: 'greet',
      },
    },
  },
  // The second state: 'greet'
  greet: {
    // The props for this component come from the output of the previous command
    component: async (props: { greeting: string }) => ({
      text: props.greeting,
    }),
    // This state doesn't handle any input, so the flow will end here.
  },
});

// 6. Register the flow with the router
router.addFlow(welcomeFlow);
```

## 5. Start the Bot

Finally, we need to connect our `router` to the `client` and start listening for updates from Telegram.

```typescript
// index.ts (at the end of the file)

// 7. Start polling for updates
console.log('Bot starting...');
client.startPolling((update) => {
  // For every update, pass it to the router
  router.handle(update, client);
});
```

## 6. Run It!

Your `index.ts` file should now be complete. You can run it with Bun:

```bash
bun run index.ts
```

Go to your bot in Telegram, send `/start`, and then type your name. You should see the bot greet you!

### Full Code

Here is the complete `index.ts` file for reference:

```typescript
import { TelegramClient } from '@bot-machine/telegram-client';
import { Router, session, createFlow, createCommand } from '@bot-machine/core';
import { z } from 'zod';

// 1. Initialize the Telegram Client
const client = new TelegramClient('YOUR_BOT_TOKEN');

// 2. Create a router
const router = new Router();

// 3. Use the session middleware (important for flows)
router.use(session());

// 4. Register a simple command handler
router.onCommand('start', async (ctx) => {
  await ctx.reply('Hello, world! Let\'s start the flow.');
  await ctx.enterFlow('welcome');
});

// 5. Define a Flow
const welcomeFlow = createFlow('welcome', {
  index: {
    component: async (props) => ({
      text: 'Welcome! What is your name?',
    }),
    onText: {
      ':name': {
        command: createCommand({
          input: z.object({ name: z.string() }),
          output: z.object({ greeting: z.string() }),
          execute: async ({ name }) => {
            return { greeting: `Hello, ${name}!` };
          },
        }),
        nextState: 'greet',
      },
    },
  },
  greet: {
    component: async (props: { greeting: string }) => ({
      text: props.greeting,
    }),
  },
});

// 6. Register the flow with the router
router.addFlow(welcomeFlow);

// 7. Start polling for updates
console.log('Bot starting...');
client.startPolling((update) => {
  router.handle(update, client);
});
```

## Next Steps

Now that you have a basic bot running, you can explore the core concepts in more detail.

- **Continue to the next guide: [Core Concepts](../03-core-concepts/README.md)**
