# Introduction to Bot-Machine

`bot-machine` is a lightweight and modern framework for building Telegram bots. Its design is inspired by the declarative UI patterns of React and the middleware architecture of Express.js.

The primary goal of this framework is to provide a highly structured, predictable, and scalable environment for bot development. It is built for developers who need to create complex, stateful conversations while maintaining clean, testable, and maintainable code.

## The AI-First Design Philosophy

A unique aspect of `bot-machine` is that it was designed with a new kind of developer in mind: the **AI Coding Agent**.

By optimizing for a programmatic developer that lacks human intuition, we created a framework with extreme clarity and zero ambiguity. This results in an architecture that is not only efficient for AI to work with but is also demonstrably better for human developers.

This philosophy is built on two core requirements:

### 1. Schema-First Data Contracts

In `bot-machine`, there is no `any` type at the boundaries of your business logic. Every `Command` and `Query` has a machine-readable **input** and **output** schema defined using **Zod**.

```typescript
import { z } from 'zod';
import { createCommand } from '@bot-machine/core';

// The contract is explicit and validated at runtime.
const renameCounterCmd = createCommand({
  input: z.object({ newName: z.string().min(1) }),
  output: z.object({ success: z.boolean() }),
  execute: async ({ input, ctx }) => {
    // The framework guarantees that `input` is `{ newName: string }`.
    // It also guarantees that the return value must be `{ success: boolean }`.
    // ...
    return { success: true };
  }
});
```

**Benefit:** This eliminates a massive class of runtime errors, provides documentation-as-code, and allows both humans and AI to understand what data a function needs and what it will return.

### 2. Type-Safe State Transitions

Conversational flows are complex state machines. `bot-machine` eliminates "magic strings" for state transitions, which are a common source of bugs. The `createFlow` factory provides a type-safe way to reference states, enabling IDE autocompletion and compile-time checks.

```typescript
const myFlow = createFlow('myFlowName', {
  start: { /* ... */ },
  middle: { /* ... */ },
  end: { /* ... */ },
});

// In a state definition...
{
  command: someCommand,
  // CORRECT: Type-safe, autocompletes, and will fail to compile if 'end' doesn't exist.
  nextState: myFlow.states.end,

  // WRONG: Prone to typos, not discoverable, will fail silently at runtime.
  // nextState: 'end_state',
}
```

**Benefit:** Refactoring is safer, development is faster with autocompletion, and the entire conversational flow is more robust and predictable.

## Who is this for?

`bot-machine` is for you if:

- You are building a bot with complex, multi-step dialogues.
- You value clean architecture and a clear separation of concerns (UI vs. Logic).
- You want to leverage TypeScript for more than just basic type-checking.
- You are interested in AI-assisted development workflows.
- You find other bot frameworks either too simplistic or too heavy with boilerplate.

## Next Steps

Now that you understand the "why", let's build your first bot.

- **Continue to the next guide: [Getting Started](./02-getting-started.md)**
