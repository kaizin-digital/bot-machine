# bot-machine Project Context

## Project Overview

The `bot-machine` is a lightweight and modern framework for building Telegram bots, inspired by Express.js and React. It's part of the computer-master-bot monorepo and designed to provide an easy-to-use interface for creating stateful, multi-step conversational flows in Telegram bots.

**Key Features:**
- Express.js-style routing for Telegram updates
- React-inspired component-based UI rendering
- Stateful conversation flows with state machines
- Session management with support for both in-memory and Redis storage
- Zod-based input/output validation for business logic
- Pattern matching for text and callback queries
- Middleware support for cross-cutting concerns

## Project Structure

```
src/
├── index.ts                 # Main application entry point
├── router.ts                # Core routing logic
├── flow.ts                  # Flow/state machine implementation
├── context.ts               # Bot context implementation
├── types.ts                 # Type definitions
├── session.ts               # Session management middleware
├── keyboard.ts              # Inline keyboard builder
├── text.ts                  # Text formatting utilities
├── utils.ts                 # Utility functions
├── core/                    # Business logic core
├── flows/                   # Stateful conversation flows
├── session/                 # Session store implementations
└── ...                      # Other components
```

## Architecture

### Core Components

1. **Router**: The main routing system that dispatches updates to appropriate handlers, middleware, and flow controllers. Supports commands, callback queries, and text pattern matching.

2. **BotContext**: The context object passed to handlers containing the raw update, Telegram client, session data, and helper methods for replying and managing flows.

3. **FlowController**: State machine implementation for managing multi-step conversations. Handles transitions between states based on user actions.

4. **Components**: UI rendering functions that return message payloads with text and inline keyboards.

5. **Session Management**: Supports both in-memory and Redis-based session storage with middleware that loads and saves session data automatically.

### Key Concepts

- **Flows**: Stateful, multi-step conversations with defined states and transitions
- **Actions**: Commands triggered by user interactions within flows
- **Commands**: Business logic operations with input/output validation
- **Queries**: Data fetching operations
- **Middleware**: Functions that process updates before handlers
- **Components**: Functions that render UI based on data

## Building and Running

### Prerequisites
- Bun runtime (version 1.2.19+)
- Node.js (for development)

### Setup
```bash
# Install dependencies
bun install

# Run the bot
bun run index.ts
```

### Environment Variables
- `BOT_TOKEN`: Required Telegram bot token from @BotFather
- `REDIS_URL`: Optional Redis URL for persistent session storage

### Configuration
The bot is configured in `src/index.ts` where you can:
- Initialize the Telegram client with your bot token
- Configure the router with middleware
- Set up session storage (in-memory or Redis)
- Register flows and stateless commands

## Development Conventions

### Flow Architecture
- Flows are defined using the `createFlow()` factory function
- Each flow has named states with components and optional onEnter queries
- States can handle actions (callback queries) and text input
- State transitions are managed by action handlers

### Component Development
- Components are asynchronous functions returning `MessagePayload`
- Components receive props inferred from query output schemas
- Use the `Keyboard` class to build inline keyboards
- Use the `text` utility for formatted messages

### Business Logic
- Use Zod schemas for input/output validation
- Commands and queries are strongly typed
- Business logic is separated from presentation logic

### Session Management
- Sessions are automatically loaded/saved by middleware
- Session data is user-specific (keyed by user ID)
- Redis is recommended for production deployments

## Key Dependencies

- `@bot-machine/telegram-client`: Low-level Telegram API client
- `redis`: Redis client for session storage
- `zod`: Runtime validation and type inference
- `@types/bun`: Type definitions for Bun runtime

## Testing

Tests can be added using the `*.test.ts` pattern. There's already a `session.test.ts` file in the codebase.

## Common Operations

### Adding a New Command
```typescript
router.onCommand("commandName", async (ctx) => {
  await ctx.reply("Response to command");
});
```

### Creating a New Flow
1. Define the flow configuration using `createFlow()`
2. Create components for each state
3. Implement commands/queries for business logic
4. Register the flow with the router using `router.addFlow()`

### Adding Middleware
```typescript
router.use(session()); // Session middleware
// Other middleware functions can be added
```

## Project Purpose

This is a stateful Telegram bot framework that allows developers to create complex conversational flows with ease. It's designed to handle multi-step interactions while maintaining clean separation between UI, business logic, and state management.