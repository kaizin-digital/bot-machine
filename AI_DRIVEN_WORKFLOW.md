
# AI-Driven Workflow: Development Methodology for `bot-machine`

## Core Principle

Development follows a **top-down, schema-first** approach. We begin by describing **WHAT** the system does (its data structures, states, and transitions) before defining **HOW** it does it (the implementation logic). This workflow allows an AI agent (or a human developer following the discipline) to proceed with maximum confidence at each step, ensuring the system remains consistent and type-safe throughout the entire process.

The development of a new feature (e.g., "pizza ordering") proceeds through the following steps.

---

### Step 1: Decompose & Define Contracts (Schema-First)

This is the most critical phase, executed within the `/src/core/` directory. We do not write implementation logic here. We describe the **data**.

1.  **Identify Entities:** What data does the feature operate on?
    *   *Example: "For a pizza order, we need its `size`, `type`, and delivery `address`."*

2.  **Define Commands & Queries:** What actions and data requests are necessary?
    *   *Example: "We need a `createOrderCommand` and a `getOrderQuery`."*

3.  **Write the Schemas (Zod):** For each command and query, we define the input and output data structures using Zod. This forms our **machine-readable contract**.

    *AI Agent Action: Create `src/core/pizza.ts`*
    ```typescript
    import { z } from 'zod';
    import { createCommand, createQuery } from '../core';

    // Output schema for the query
    const PizzaOrderOutput = z.object({
      id: z.string(),
      size: z.enum(['small', 'medium', 'large']).optional(),
      type: z.string().optional(),
      status: z.enum(['pending', 'delivered']),
    });

    // Input schema for the command
    const CreateOrderInput = z.object({
      size: z.enum(['small', 'medium', 'large']),
      type: z.string(),
      address: z.string().min(10),
    });

    // Create "scaffolds" for commands and queries with their contracts.
    // The actual logic can be a placeholder for now.
    export const getOrderQuery = createQuery({
      input: z.object({ id: z.string() }),
      output: PizzaOrderOutput,
      execute: async ({ id }) => ({ id, status: 'pending' }), // Placeholder logic
    });

    export const createOrderCommand = createCommand({
      input: CreateOrderInput,
      output: PizzaOrderOutput,
      execute: async (input) => ({ id: '123', ...input, status: 'pending' }), // Placeholder logic
    });
    ```
**Result of Step 1:** We have a strictly-typed API for our business logic. The rest of the system will be built upon these types. Data-related errors are now preventable at compile time.

---

### Step 2: Describe the UI (Declarative Components)

With the data contracts established, we can now describe the UI.

1.  **Create Components:** For each screen (state) of the dialogue, create a corresponding component file (e.g., in `/src/flows/components/`).
2.  **Use UI Builders:** Use the `message` and `Keyboard` builders to define the text and buttons. The `props` for the component are inferred directly from the `output` schema of our queries.

    *AI Agent Action: Create `src/flows/pizza/SelectSize.component.ts`*
    ```typescript
    import { message, Keyboard } from '@bot-machine/ui'; // (hypothetical path)
    import { z } from 'zod';
    import { getOrderQuery } from '../../core/pizza';

    // The component's props type is inferred from the Zod schema!
    type Props = z.infer<typeof getOrderQuery.output>;

    export async function SelectSizeComponent(props: Props) {
      const kbd = new Keyboard()
        .text('Small', 'select_size:small')
        .text('Medium', 'select_size:medium')
        .text('Large', 'select_size:large');

      const msg = message(({ i, b }) => [
        b('Order #'), i(props.id), b(': Please select a size'),
      ]);

      return { ...msg, reply_markup: kbd.inline() };
    }
    ```
**Result of Step 2:** We have a collection of independent, strictly-typed UI components.

---

### Step 3: Define the Dialogue Flow (State Machine)

Here, we connect the business logic and the UI.

1.  **Create Flow File:** e.g., `src/flows/pizza/pizza.flow.ts`.
2.  **Describe States:** Using `createFlow`, define all states (`selectSize`, `selectType`, `getAddress`, `confirm`). For each state, wire up its `component`, its `onEnter` query (to fetch data), and its `onAction`/`onText` handlers (to process user input).

    *AI Agent Action: Update `pizza.flow.ts`*
    ```typescript
    export const pizzaFlow = createFlow({
      'selectSize': {
        component: SelectSizeComponent,
        onEnter: getOrderQuery, // Use the query from Step 1
        onAction: {
          'select_size::size': {
            command: updateOrderSizeCommand, // Use a command defined in Step 1
            nextState: 'selectType',
          }
        }
      },
      // ... other states
    });
    ```
**Result of Step 3:** The entire dialogue logic is described in a single, readable, and type-safe location.

---

### Step 4: Integrate and Implement

The final phase.

1.  **Register Flow:** In `index.ts`, add `router.addFlow(pizzaFlow)` and a command to enter the flow (e.g., `/pizza`).
2.  **Implement Logic:** Return to `src/core/pizza.ts` and fill in the real implementation logic inside the `execute` functions, replacing the placeholders. This is now the last and easiest step, as the entire framework and all data contracts are already in place and verified by the compiler.

### Conclusion

This workflow transforms development into a predictable, assembly-line process. An AI agent can execute these steps sequentially, and the system remains consistent and operational at every stage. This minimizes the probability of errors and makes the feature creation process transparent and manageable. This is the essence of AI-driven development.
