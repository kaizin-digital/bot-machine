
# Spec: Text Builder

## 1. Rationale

Composing messages with rich text formatting (bold, italic, links, etc.) using raw HTML or Markdown strings is cumbersome and error-prone. It forces the developer to manually handle tags and entities, which can lead to parsing errors and a poor Developer Experience (DX).

A `Text` builder will provide a fluent, safe, and declarative API for constructing richly formatted messages.

## 2. Proposed API

The builder will be a class that manages a collection of text fragments, each with its own formatting. It will automatically handle the assembly of the final string and determine the correct `parse_mode`.

### Basic Example

```typescript
import { Text } from './text'; // Future implementation

const message = new Text()
  .bold('Hello, ').text(ctx.from.first_name).plain('!') // Chain formatting on one line
  .newline(2) // Add two newlines
  .italic('This is a bot-machine bot.')
  .newline()
  .link('Visit our website', 'https://example.com');

// The builder then provides the final text and the correct parse mode.
await ctx.reply(message.build(), { parse_mode: message.parseMode() });
// Or, even better, the context methods could accept the builder directly.
await ctx.reply(message);
```

### Core Concepts

1.  **Fluent Interface:** All methods for adding text fragments return `this` to allow chaining.
2.  **Automatic `parse_mode`:** The builder tracks which formatting methods are used. If any method requiring HTML is called (e.g., `.link()`), `parseMode()` will return `'HTML'`. Otherwise, it could potentially use `'MarkdownV2'` or no `parse_mode` at all.
3.  **Entity Management:** Internally, the builder does not just concatenate strings. It should manage an array of text fragments and their associated formatting types. The `.build()` method then intelligently constructs the final string with the correct tags.
4.  **Escaping:** The builder will be responsible for automatically escaping special characters in plain text fragments to prevent them from being interpreted as formatting tags.

## 3. Required Methods

The `Text` class should have the following methods.

### Content Methods

*   `.text(content: string | number)` or `.plain(...)`: Adds a plain text fragment (with escaping).
*   `.bold(content: string | number)`: Adds a bolded fragment.
*   `.italic(content: string | number)`: Adds an italicized fragment.
*   `.underline(content: string | number)`: Adds an underlined fragment.
*   `.strikethrough(content: string | number)`: Adds a strikethrough fragment.
*   `.spoiler(content: string | number)`: Adds a spoiler fragment.
*   `.code(content: string | number)`: Adds an inline, fixed-width code fragment.
*   `.pre(content: string | number, language?: string)`: Adds a pre-formatted code block.
*   `.link(text: string, url: string)`: Adds a hyperlink.
*   `.mention(text: string, user_id: number)`: Adds an inline mention of a user.
*   `.hashtag(content: string)`: Adds a hashtag.
*   `.newline(count: number = 1)`: Adds one or more newline characters.

### Shorthand Aliases

To improve DX and reduce verbosity for complex messages, each content method should also have a short alias.

*   `.text()` -> `.t()`
*   `.plain()` -> `.p()`
*   `.bold()` -> `.b()`
*   `.italic()` -> `.i()`
*   `.underline()` -> `.u()`
*   `.strikethrough()` -> `.s()`
*   `.spoiler()` -> `.sp()`
*   `.code()` -> `.c()`
*   `.pre()` -> `.pr()`
*   `.link()` -> `.l()`
*   `.mention()` -> `.m()`
*   `.hashtag()` -> `.h()`
*   `.newline()` -> `.n()`

### Output Methods

*   `.build()`: Constructs and returns the final formatted string (e.g., with HTML tags).
*   `.parseMode()`: Returns the appropriate `parse_mode` for the built string (`'HTML'`, `'MarkdownV2'`, or `undefined`).

## 4. Usage in Framework

Ideally, `ctx.reply` and `ctx.editMessageText` would be overloaded to accept an instance of the `Text` builder directly. The methods would then internally call `.build()` and `.parseMode()`.

```typescript
// This should be the final DX goal
const message = new Text()
  .bold('Hello, ').text(ctx.from.first_name);

await ctx.reply(message);
```
