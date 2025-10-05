# API: Keyboard

`import { Keyboard } from '@bot-machine/core';`

The `Keyboard` class provides a fluent API for easily creating Telegram keyboards.

## `new Keyboard()`

Creates a new `Keyboard` builder instance.

```typescript
const k = new Keyboard();
```

## Chaining Methods

All button methods can be chained. They add a button to the current row.

### `text(text, callback_data)`

Adds a standard button that sends a callback query.

-   **`text: string`**: The text on the button.
-   **`callback_data: string`**: The data to send when pressed.

### `url(text, url)`

Adds a button that opens a URL.

-   **`text: string`**: The text on the button.
-   **`url: string`**: The URL to open.

### `webApp(text, web_app)`

Adds a button that launches a Web App.

-   **`text: string`**: The text on the button.
-   **`web_app: WebAppInfo`**: The Web App info object.

### `row()`

Finalizes the current row and starts a new one.

```typescript
new Keyboard()
  .text('Button 1', 'b1')
  .text('Button 2', 'b2')
  .row() // New row
  .text('Button 3', 'b3');
```

## Finalizing Methods

These methods build the final keyboard object to be used in `ctx.reply` or a `MessagePayload`.

### `inline()`

Builds and returns an `InlineKeyboardMarkup` object.

-   **Returns**: `InlineKeyboardMarkup`

```typescript
const inlineKeyboard = new Keyboard()
  .text('Confirm', 'confirm')
  .inline();

await ctx.reply('Are you sure?', { reply_markup: inlineKeyboard });
```

### `reply(options?)`

Builds and returns a `ReplyKeyboardMarkup` object (a keyboard that appears in place of the user's main keyboard).

-   **`options?`**: Optional settings for the reply keyboard:
    -   `is_persistent?: boolean`
    -   `resize_keyboard?: boolean`
    -   `one_time_keyboard?: boolean`
    -   `input_field_placeholder?: string`
    -   `selective?: boolean`
-   **Returns**: `ReplyKeyboardMarkup`

```typescript
const replyKeyboard = new Keyboard()
  .requestContact('Share Contact')
  .reply({ resize_keyboard: true, one_time_keyboard: true });

await ctx.reply('Please share your contact', { reply_markup: replyKeyboard });
```

## Static Methods

### `Keyboard.remove(selective?)`

A static method that returns a `ReplyKeyboardRemove` object to remove the reply keyboard.

-   **`selective?: boolean`**: Whether to remove the keyboard for specific users only.
-   **Returns**: `ReplyKeyboardRemove`

```typescript
await ctx.reply('Keyboard removed.', { reply_markup: Keyboard.remove() });
```

## Other Button Types

The builder also supports less common button types:

-   `login(text, login_url)`
-   `switchInline(text, query)`
-   `switchInlineCurrent(text, query)`
-   `pay(text)`
-   `requestContact(text)`
-   `requestLocation(text)`
-   `requestPoll(text, type?)`
