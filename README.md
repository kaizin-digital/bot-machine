# bot-machine

A lightweight and modern framework for building Telegram bots, inspired by Express.js and React.

## Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Framework Concepts](#framework-concepts)
5. [API Reference](#api-reference)
6. [AI Agent Guide](#ai-agent-guide)
7. [Integration with Telegram Client](#integration-with-telegram-client)
8. [Webhook Integration](#webhook-integration)
9. [Examples](#examples)

## Overview

The bot-machine framework provides:
- Express.js-style routing for Telegram updates
- React-inspired component-based UI rendering
- Stateful conversation flows with state machines
- Session management with support for both in-memory and Redis storage
- Zod-based input/output validation for business logic
- Pattern matching for text and callback queries
- Middleware support for cross-cutting concerns

## Installation

```bash
bun install @bot-machine/telegram-sdk
```

This framework requires the `@bot-machine/telegram-client` package as a dependency.

**Note**: The framework is now using version 1.0.1 of `@bot-machine/telegram-client`. This version introduces improved type safety for keyboard buttons and inline keyboards. When upgrading from an earlier version, ensure any custom keyboard implementations are compatible with the new types.

## Quick Start

```typescript
import { Router, createFlow, createCommand, session } from '@bot-machine/telegram-sdk';
import { z } from 'zod';
import { TelegramClient } from '@bot-machine/telegram-client';

// Initialize the Telegram client
const client = new TelegramClient(process.env.BOT_TOKEN!);

// Create a router
const router = new Router();

// Use session middleware
router.use(session());

// Register a simple command
router.onCommand('start', async (ctx) => {
  await ctx.reply('Hello, world!');
});

// Create a simple flow
const welcomeFlow = createFlow('welcome', {
  'index': {
    component: async (props) => ({
      text: 'Welcome! What is your name?',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Skip', callback_data: 'skip' }]
        ]
      }
    }),
    onText: {
      ':name': {
        command: createCommand({
          input: z.object({ name: z.string() }),
          output: z.object({ greeting: z.string() }),
          execute: async (input, ctx) => {
            return { greeting: `Hello, ${input.name}!` };
          }
        }),
        nextState: 'greet'
      }
    },
    onAction: {
      'skip': {
        command: createCommand({
          input: z.object({}),
          output: z.object({ greeting: z.string() }),
          execute: async (input, ctx) => {
            return { greeting: 'Hello, stranger!' };
          }
        }),
        nextState: 'greet'
      }
    }
  },
  'greet': {
    component: async (props) => ({
      text: props.greeting,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Start over', callback_data: 'restart' }]
        ]
      }
    }),
    onAction: {
      'restart': {
        command: createCommand({
          input: z.object({}),
          output: z.object({}),
          execute: async (input, ctx) => ({})
        }),
        nextState: 'index'
      }
    }
  }
});

// Add the flow to the router
router.addFlow(welcomeFlow);

// Start polling for updates
client.startPolling((update) => {
  router.handle(update, client);
});
```

## Framework Concepts

### Router
The router is the main entry point for handling Telegram updates. It supports commands, callback queries, text patterns, and flows.

### Flows
Flows implement stateful, multi-step conversations with state machines. Each flow has named states with components and optional handlers for actions and text input.

### Context
The context object provides access to the Telegram update, session data, and methods for responding to updates.

### Components
Components are functions that render UI based on data. They receive props and return message payloads with text and inline keyboards.

### Business Logic
Business logic is managed through commands (with side effects) and queries (for data fetching), both with Zod-based validation.

### Session Management
Session middleware manages user-specific data that persists between updates.

## API Reference

For detailed API documentation, see [API_REFERENCE.md](./API_REFERENCE.md).

## AI Agent Guide

For AI agents working with this framework, see [AGENT.md](./AGENT.md) which includes common patterns, API details, and frequent mistakes to avoid.

## Integration with Telegram Client

The framework integrates with `@bot-machine/telegram-client` to handle low-level Telegram API communication. For details, see [TELEGRAM_CLIENT_INTEGRATION.md](./TELEGRAM_CLIENT_INTEGRATION.md).

## Webhook Integration

The bot-machine framework can be integrated with webhook endpoints to receive updates from Telegram instead of polling. Here's how to set this up:

### Setting Up Webhooks

```typescript
import express from 'express';
import { Router, session } from '@bot-machine/telegram-sdk';
import { TelegramClient } from '@bot-machine/telegram-client';

const app = express();
const router = new Router();
const client = new TelegramClient(process.env.BOT_TOKEN!);

// Middleware to parse JSON bodies
app.use(express.json());

// Register your bot routes
router.use(session());
router.onCommand('start', async (ctx) => {
  await ctx.reply('Hello from webhook!');
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    await router.handle(update, client);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, async () => {
  // Set the webhook URL in Telegram
  await client.setWebhook('https://your-domain.com/webhook');
  console.log('Bot server running on port 3000');
});
```

### Comparing Polling vs Webhooks

- **Polling**: Simpler to set up, good for development and low-traffic bots
- **Webhooks**: More efficient for production, better performance at scale, but requires HTTPS endpoint

### Webhook Security

For production deployments, ensure your webhook endpoint is secure:
- Use HTTPS with a valid SSL certificate
- Verify that requests are coming from Telegram using secret tokens
- Add rate limiting to prevent abuse

### Error Handling in Webhook Mode

When using webhooks, ensure you respond to Telegram within the timeout period (typically 5-10 seconds) to prevent retries:

```typescript
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    // Process update asynchronously to handle timeout
    router.handle(update, client).catch(console.error);
    res.status(200).json({ status: 'accepted' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Examples

For more examples, check out the test files in the `src/` directory, particularly `integration.test.ts` and `flow.test.ts`.