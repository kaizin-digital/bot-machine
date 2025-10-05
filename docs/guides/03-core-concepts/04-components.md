# Core Concept: Components

In `bot-machine`, a **Component** is a function that is responsible for **rendering the user interface** for a given state in a `Flow`. It separates your presentation logic from your business logic.

This is conceptually similar to components in UI frameworks like React. A component receives data (props) and returns a description of the UI to be rendered.

## Component Signature

A component is an `async` function with the following signature:

```typescript
import { MessagePayload } from '@bot-machine/core';

type Component = (props: any) => Promise<MessagePayload>;
```

-   `props: any`: The data needed to render the component. This data comes from the result of the `onEnter` query defined for the state.
-   `Promise<MessagePayload>`: The component must return a `MessagePayload` object, which describes what the final message should look like.

## The `MessagePayload`

The `MessagePayload` is a simple object that describes the content of a Telegram message.

```typescript
interface MessagePayload {
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  reply_markup?: { // An inline keyboard
    inline_keyboard: InlineKeyboardButton[][];
  };
}
```

-   `text`: The main text content of the message.
-   `parse_mode`: (Optional) Set to `'HTML'` to use HTML tags for formatting. The `format` helper utility makes this easy.
-   `reply_markup`: (Optional) The inline keyboard to attach to the message. The `Keyboard` builder is the recommended way to create this.

## Example

Let's look at a component for the counter `Flow` we discussed previously. The `onEnter` query for its state returns an object like `{ count: number }`. This object becomes the `props` for our component.

```typescript
import { MessagePayload, Keyboard, format } from '@bot-machine/core';

// The props for this component are typed based on the output of the onEnter query.
interface CounterProps {
  count: number;
}

export const CounterComponent = async (props: CounterProps): Promise<MessagePayload> => {
  const { count } = props;

  // 1. Define the message text using the format() helper for HTML.
  const text = format(t => [
    t.b('Current Count:'), // Bold
    ' ',
    t.c(count), // Inline code
  ]);

  // 2. Define the keyboard using the Keyboard builder.
  const keyboard = new Keyboard()
    .text('➕ Increment', 'increment')
    .text('➖ Decrement', 'decrement')
    .row() // Start a new row
    .text('Done', 'done');

  // 3. Return the final MessagePayload.
  return {
    text: text.text, // Get the raw string from the FormattedText object
    parse_mode: text.parseMode, // Get the parse mode ('HTML')
    reply_markup: keyboard.inline(), // Get the keyboard markup
  };
};
```

## Benefits of Using Components

-   **Separation of Concerns:** Your business logic (`Commands` and `Queries`) focuses on what your application does, while your `Components` focus on how it looks. This makes your code easier to read, test, and maintain.
-   **Reusability:** You can reuse the same component in multiple states if they need to display similar information.
-   **Declarative UI:** You describe *what* the UI should look like for a given set of data, and the framework handles the work of sending or editing the message.
-   **Testability:** Components are pure functions. You can easily test them by passing in different `props` and asserting that the returned `MessagePayload` is correct, without needing to interact with the Telegram API.
