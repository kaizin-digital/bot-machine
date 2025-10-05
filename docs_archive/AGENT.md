# bot-machine Framework: AI Agent Quick Reference

This document provides concise information for AI agents (like Qwen, Gemini, etc.) to correctly implement code using the bot-machine framework. It includes common patterns, API details, and frequent mistakes to avoid.

**Important**: The bot-machine framework integrates with `@bot-machine/telegram-client` version 1.0.0 and above. When generating code, ensure you're using the latest API patterns from the updated client package.

## Framework Overview

The bot-machine is a lightweight and modern framework for building Telegram bots, inspired by Express.js and React. It provides:
- Express.js-style routing for Telegram updates
- React-inspired component-based UI rendering
- Stateful conversation flows with state machines
- Session management with support for both in-memory and Redis storage
- Zod-based input/output validation for business logic

## Key API Components

### 1. Router API

**Creating a Router:**
```typescript
import { Router } from './router';
const router = new Router();
```

**Route Registration:**
- `router.onCommand(pattern, handler)` - For slash commands
- `router.onCallbackQuery(pattern, handler)` - For inline keyboard callbacks
- `router.onText(pattern, handler)` - For text messages
- `router.addFlow(flow)` - For stateful flows
- `router.use(middleware)` - For middleware

**Pattern Matching:**
- Use Express-style patterns like `action::id` which becomes `/:action/:id`
- Parameters are captured in `ctx.params` (e.g., `ctx.params.id`)
- Can also use plain RegExps for complex patterns

### 2. Flow API

**Creating Flows:**
```typescript
import { createFlow } from './flow';
import { createCommand } from './core';

export const myFlow = createFlow('flowName', {
  // state definitions
});
```

**State Definition:**
```typescript
'stateName': {
  component: ComponentFunction,
  onEnter?: query,      // Fetch data when entering state
  onAction?: {          // Handle callback queries
    'pattern': {
      command: command,
      nextState: 'nextState' | function(result) { return 'state'; },
      refresh: boolean   // Re-render current state instead of transitioning
    }
  },
  onText?: {            // Handle text messages
    // Same structure as onAction
  }
}
```

**Action Handler Properties:**
- `command`: A BotCommand that executes business logic
- `nextState`: Next state name or function(result) returning state name
- `refresh`: If true, re-renders current state with result

### 3. Context API

**Key Properties:**
- `ctx.session` - User-specific data persisted between updates
- `ctx.params` - Parameters captured from route patterns
- `ctx.update` - Raw Telegram update object
- `ctx.from` - User who initiated the update
- `ctx.chat` - Chat where the update originated

**Key Methods:**
- `ctx.reply(text, extra?)` - Send a new message
- `ctx.editMessageText(text, extra?)` - Edit existing message
- `ctx.answerCallbackQuery(text?)` - Respond to inline keyboard press
- `ctx.enterFlow(name, initialState?)` - Enter a stateful flow

### 4. Component API

**Component Definition:**
```typescript
type Component = (props: any) => Promise<MessagePayload>;

interface MessagePayload {
  text: string;
  parse_mode?: "HTML" | "MarkdownV2";
  reply_markup?: InlineKeyboardMarkup;
}
```

### 5. Business Logic API

**Creating Commands:**
```typescript
import { createCommand, createQuery } from './core';

export const myCommand = createCommand({
  input: z.object({ ... }),   // Zod input validation
  output: z.object({ ... }),  // Zod output validation
  execute: async (input, ctx) => {
    // Business logic here
    return result;
  }
});
```

## Common Mistakes to Avoid

### 1. Incorrect Flow Creation
❌ **WRONG:**
```typescript
// Don't do this
const myFlow = {
  name: 'myFlow',
  config: { ... }
};
```

✅ **CORRECT:**
```typescript
// Use the factory function
import { createFlow } from './flow';
const myFlow = createFlow('myFlow', {
  // state definitions
});
```

### 2. Missing Zod Validation
❌ **WRONG:**
```typescript
// Don't do this
export const myCommand = {
  execute: async (input, ctx) => { ... }
};
```

✅ **CORRECT:**
```typescript
// Always use createCommand/createQuery with Zod schemas
import { createCommand } from './core';
import { z } from 'zod';

export const myCommand = createCommand({
  input: z.object({ name: z.string() }),
  output: z.object({ result: z.string() }),
  execute: async (input, ctx) => { ... }
});
```

### 3. Incorrect Pattern Syntax
❌ **WRONG:**
```typescript
// Don't use Express.js colon syntax
router.onCommand('/user/:id', handler);
```

✅ **CORRECT:**
```typescript
// Use double-colon syntax in bot-machine
router.onCommand('user::id', handler);
// Or use plain RegExp
router.onCommand(/^user:(.+)$/, handler);
```

### 4. Not Using Keyboard Builder
❌ **WRONG:**
```typescript
// Don't manually construct keyboard objects
{ reply_markup: { inline_keyboard: [[{ text: 'Button', callback_data: 'action' }]] } }
```

✅ **CORRECT:**
```typescript
// Use the Keyboard builder
import { Keyboard } from './keyboard';
const keyboard = new Keyboard()
  .text('Button', 'action')
  .inline();
```

### 5. Incorrect Context Usage
❌ **WRONG:**
```typescript
// Don't access raw update properties directly when helpers exist
const text = ctx.update.message?.text;
```

✅ **CORRECT:**
```typescript
// Use context properties and methods
const text = ctx.update.message?.text;
// Or for parameters from patterns
const paramValue = ctx.params.paramName;
```

## Type-Safe Patterns to Follow

### 1. Flow State Transitions
```typescript
// Use type-safe state references
myFlow.states.stateName
```

### 2. Command/Query Creation
```typescript
// Always use the create functions
import { createCommand, createQuery } from './core';
```

### 3. Context Manipulation
```typescript
// Safely access session data
ctx.session.userData = { ... };
// Access captured parameters
const id = ctx.params.id;
```

## Complete Example

```typescript
// flow.example.ts
import { createFlow } from './flow';
import { createCommand, createQuery } from './core';
import { z } from 'zod';
import { MyComponent } from './components/My.component';

// Define query to fetch data
const getUserQuery = createQuery({
  input: z.object({ userId: z.string() }),
  output: z.object({ name: z.string(), count: z.number() }),
  execute: async (input, ctx) => {
    // Fetch user data
    return { name: 'John', count: 0 };
  }
});

// Define command to update data
const incrementCommand = createCommand({
  input: z.object({ userId: z.string() }),
  output: z.object({ newCount: z.number() }),
  execute: async (input, ctx) => {
    // Business logic
    return { newCount: 1 };
  }
});

// Create the flow
export const userFlow = createFlow('user', {
  'start': {
    component: MyComponent,
    onEnter: getUserQuery,
    onAction: {
      'increment': {
        command: incrementCommand,
        refresh: true
      },
      'next': {
        command: incrementCommand,
        nextState: userFlow.states.details
      }
    }
  },
  'details': {
    component: MyComponent,
    onText: {
      ':input': {
        command: incrementCommand,
        nextState: userFlow.states.start
      }
    }
  }
});
```

This framework emphasizes type safety, clear separation of concerns, and expressive pattern matching for building complex Telegram bot interactions.
