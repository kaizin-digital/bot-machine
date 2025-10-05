# API: Components

This section covers the APIs related to UI rendering.

## `Component`

A `Component` is a type alias for an async function that receives props and returns a `MessagePayload`.

```typescript
import { MessagePayload } from '@bot-machine/core';

type Component = (props: any) => Promise<MessagePayload>;
```

-   **`props`**: The data passed to the component, which is the result of the `onEnter` query for the state the component is used in.

## `MessagePayload`

An interface describing the content of a message to be sent to Telegram.

-   **`text: string`**: The text content of the message.
-   **`parse_mode?: 'HTML' | 'MarkdownV2'`**: The parse mode for the message text. It is recommended to use the `format` helper, which automatically sets this to `'HTML'` when needed.
-   **`reply_markup?: { inline_keyboard: InlineKeyboardButton[][] }`**: The inline keyboard markup for the message. It is recommended to use the `Keyboard` builder to create this object.

### Example

```typescript
import { MessagePayload, Keyboard } from '@bot-machine/core';

const MyComponent: Component = async (props: { name: string }) => {
  return {
    text: `Hello, <b>${props.name}</b>!`,
    parse_mode: 'HTML',
    reply_markup: new Keyboard().text('Done', 'done').inline(),
  };
};
```

## `format(builderFn)`

`import { format } from '@bot-machine/core';`

A helper function for creating richly formatted text using HTML.

-   **`builderFn: (tools: Tools) => Fragment`**: A function that receives a `tools` object and returns a tree of message fragments.
-   **Returns**: A `FormattedText` object containing the final `text` and `parseMode`.

### `Tools` Object

The `tools` object passed to the builder function contains the following methods:

-   `t.b(content)`: Bold
-   `t.i(content)`: Italic
-   `t.u(content)`: Underline
-   `t.s(content)`: Strikethrough
-   `t.sp(content)`: Spoiler
-   `t.c(content)`: Inline code
-   `t.l(text, url)`: Link
-   `t.n(count?)`: Newline (defaults to 1)
-   `t.p(content)`: Plain text (escapes HTML characters)

### `FormattedText` Object

The return value of `format()`.

-   **`text: string`**: The final, HTML-formatted string.
-   **`parseMode: 'HTML' | undefined`**: The parse mode to use.

### Example

```typescript
import { format } from '@bot-machine/core';

const message = format(t => [
  t.b('Hello!'),
  t.n(2), // 2 newlines
  'Your total is: ',
  t.c('$99.99'),
]);

// To use it:
await ctx.reply(message);
```
