# API: Flows

This section covers the APIs for creating and managing stateful conversations (Flows).

## `createFlow(name, config)`

`import { createFlow } from '@bot-machine/core';`

A factory function for creating a type-safe `FlowDefinition`.

-   **`name: string`**: A unique name for the flow.
-   **`config: FlowConfig`**: An object where keys are state names and values are `FlowState` definitions.
-   **Returns**: A `FlowDefinition` object.

### `FlowDefinition<TConfig>`

The object returned by `createFlow`. It contains:

-   **`name: string`**: The name of the flow.
-   **`config: TConfig`**: The original configuration object.
-   **`states: { [K in keyof TConfig]: K }`**: A type-safe map of state names, used for safe state transitions (e.g., `myFlow.states.start`).

### `FlowConfig`

An object that maps state names to `FlowState` objects.

```typescript
const config: FlowConfig = {
  start: { /* FlowState for 'start' */ },
  middle: { /* FlowState for 'middle' */ },
}
```

### `FlowState`

An object that defines a single state in the state machine.

-   **`component: Component`**: (Required) The component function to render the UI for this state.
-   **`onEnter?: BotQuery`**: An optional `Query` to execute when entering this state. Its result is passed as `props` to the `component`.
-   **`onAction?: Record<string, ActionHandler>`**: A map of handlers for `callback_query` data.
-   **`onText?: Record<string, ActionHandler>`**: A map of handlers for text messages.

### `ActionHandler`

An object that defines the reaction to a user input.

-   **`command: BotCommand`**: The business logic `Command` to execute.
-   **`nextState?: string | ((result: any) => string)`**: The next state to transition to. If omitted, the flow exits.
-   **`refresh?: boolean`**: If `true`, re-renders the current state instead of transitioning.

## `new FlowController(config, name)`

`import { FlowController } from '@bot-machine/core';`

This class manages the runtime execution of a flow. You typically create an instance of this and register it with the `Router`.

-   **`config: FlowConfig`**: The `config` object from a `FlowDefinition`.
-   **`name: string`**: The `name` from a `FlowDefinition`.

```typescript
import { FlowController } from '@bot-machine/core';
import { myFlowDef } from './my.flow';

const myFlowController = new FlowController(myFlowDef.config, myFlowDef.name);
router.addFlow(myFlowController);
```
