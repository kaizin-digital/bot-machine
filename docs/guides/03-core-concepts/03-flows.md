# Core Concept: Flows & State Machines

While stateless routes are useful for simple commands, most interesting conversations have multiple steps. A user might need to go through a registration process, configure a product, or complete a quiz. `Flows` are the mechanism `bot-machine` uses to manage this stateful, multi-step logic.

A **Flow** is a **state machine**. You define a set of named `states`, and for each state, you define how it should react to user input (`onAction` for button clicks, `onText` for messages). Based on that input, you can transition the user to another state.

## The Anatomy of a Flow

A flow is defined using the `createFlow` factory function, which ensures type safety.

```typescript
import { createFlow, createCommand } from '@bot-machine/core';
import { z } from 'zod';
import { CounterComponent } from './components'; // Assume this exists

// A command to update our counter
const updateCounterCommand = createCommand({
  input: z.object({ by: z.number() }),
  output: z.object({ newCount: z.number() }),
  execute: async ({ by }, ctx) => {
    const currentCount = ctx.session.count ?? 0;
    const newCount = currentCount + by;
    ctx.session.count = newCount; // Update the session
    return { newCount };
  },
});

// A query to get the current count
const getCounterQuery = createQuery({
  input: z.void(),
  output: z.object({ count: z.number() }),
  execute: async (_, ctx) => {
    return { count: ctx.session.count ?? 0 };
  },
});

// Create the flow
export const counterFlow = createFlow('counter', {
  // This is the initial state, named 'index'
  index: {
    // 1. What to do when entering the state
    onEnter: getCounterQuery,
    // 2. What UI to show
    component: CounterComponent,
    // 3. How to react to button clicks
    onAction: {
      'increment': {
        command: updateCounterCommand.partial({ by: 1 }), // Pre-fill command input
        refresh: true, // Re-render this same state
      },
      'decrement': {
        command: updateCounterCommand.partial({ by: -1 }),
        refresh: true,
      },
      'done': {
        command: noopCommand, // A built-in command that does nothing
        // nextState is undefined, so the flow will exit
      },
    },
  },
});
```

Let's break down the `index` state definition:

### 1. `onEnter`: Fetching Data for the State

-   `onEnter?: BotQuery`

When a user transitions to a new state, the `onEnter` query is executed first. This is the ideal place to fetch any data needed to render the state's UI (e.g., loading user data from a database, fetching an API).

The result of this query is then passed as `props` to the `component`.

### 2. `component`: Rendering the User Interface

-   `component: Component`

After `onEnter` completes, the `component` function is called with the query's result. The component's job is to return a `MessagePayload`—an object describing the message text and keyboard to show the user.

This separates your data-fetching logic (`onEnter`) from your presentation logic (`component`).

### 3. `onAction` & `onText`: Handling User Input

-   `onAction?: Record<string, ActionHandler>`
-   `onText?: Record<string, ActionHandler>`

These objects map input patterns to `ActionHandlers`. `onAction` is for `callback_data` from buttons, and `onText` is for text messages.

When a user sends input that matches a pattern, the corresponding `ActionHandler` is executed.

## The Action Handler

An `ActionHandler` tells the flow what to do next. It has three key properties:

-   `command: BotCommand`
    The business logic to execute. The input for the command is taken from `ctx.params` (for pattern-based captures) and can be partially pre-filled.

-   `nextState?: string | ((result: any) => string)`
    The name of the state to transition to after the command successfully completes. If you omit this, the flow will exit. You can also provide a function that determines the next state based on the command's output, allowing for conditional branching.

    ```typescript
    // Dynamic state transition
    nextState: (result) => result.isComplete ? 'final_step' : 'ask_more_questions'
    ```

-   `refresh?: boolean`
    If `true`, the flow will **not** transition to a new state. Instead, it will re-run the `onEnter` query and re-render the `component` for the **current state**. This is perfect for updating the UI without changing the conversational step, like with our counter example.

## Entering and Exiting Flows

-   **Entering:** You transition a user into a flow by calling `ctx.enterFlow('flowName')`. This is typically done from a stateless command handler (e.g., `router.onCommand('start', ...)`).

-   **Exiting:** A flow exits automatically when an `ActionHandler` is executed that does not have a `nextState` property and does not have `refresh: true`.

## The Power of Type Safety

Using `createFlow` provides a `states` object on the returned flow definition. This allows you to reference your state names in a type-safe way, preventing typos and enabling autocompletion.

```typescript
// Instead of this (error-prone):
nextState: 'index'

// You can do this (safe and autocompletes):
nextState: counterFlow.states.index
```
