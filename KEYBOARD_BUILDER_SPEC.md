
# Spec: Keyboard Builder

## 1. Rationale

Creating complex keyboards by manually constructing nested arrays is verbose, error-prone, and offers a poor Developer Experience (DX). To align with our goal of creating a simple and elegant low-code framework, we need a high-level abstraction for building keyboards.

This document specifies a `Keyboard` builder with a fluent (chainable) API, inspired by top-tier bot frameworks.

## 2. Proposed API

The builder will be a class that can be instantiated and then have methods chained to it to construct the keyboard row by row.

### Basic Example (Inline Keyboard)

```typescript
import { Keyboard } from './keyboard'; // Future implementation

const keyboard = new Keyboard()
  .text('Button 1', 'callback_1') // A button in the first row
  .text('Button 2', 'callback_2') // Another button in the first row
  .row() // Start a new row
  .url('Google', 'https://google.com'); // A URL button in the second row

// The builder can then be passed directly into the reply/edit methods.
// The framework will automatically call a method like .build() or .inline().
await ctx.reply('Message with a keyboard', { reply_markup: keyboard });
```

### Core Concepts

1.  **Chainable Methods:** Every method that adds a button returns `this` to allow chaining.
2.  **Row Management:** The `.row()` method explicitly moves to the next row. This is more readable than nested arrays.
3.  **Button Types:** The builder will have dedicated methods for each type of Telegram button.
4.  **Immutability (Optional but Recommended):** Each method call should ideally return a *new* instance of the builder to prevent accidental modification of a keyboard that is already in use elsewhere. (e.g., `const kb2 = kb1.row();`)
5.  **Output Generation:** The builder will have methods like `.inline()` and `.reply()` to generate the final `InlineKeyboardMarkup` or `ReplyKeyboardMarkup` object required by the Telegram API.

## 3. Required Methods

The `Keyboard` class should have the following methods.

### Row Management

*   `.row()`: Finalizes the current row and starts a new one.

### Inline Keyboard Buttons (`InlineKeyboardButton`)

*   `.text(text: string, callback_data: string)`: A standard button that sends a callback query.
*   `.url(text: string, url: string)`: A button that opens a URL.
*   `.login(text: string, login_url: string | LoginUrl)`: A button for a Telegram Login URL.
*   `.switchInline(text: string, query: string)`: A button that prompts the user to select a chat, opens it, and inserts the bot's username and a specified query.
*   `.switchInlineCurrent(text: string, query: string)`: Same as above, but inserts the query in the current chat.
*   `.webApp(text: string, web_app_info: WebAppInfo)`: A button that launches a Web App.
*   `.pay(text: string)`: A pay button (for Telegram Payments).

### Reply Keyboard Buttons (`KeyboardButton`)

*   `.requestContact(text: string)`: A button that requests the user's contact.
*   `.requestLocation(text: string)`: A button that requests the user's location.
*   `.requestPoll(text: string, type?: 'quiz' | 'regular')`: A button that allows the user to create and send a poll.

### Output Methods

*   `.inline()`: Returns the final `InlineKeyboardMarkup` object.
*   `.reply(options?: { resize?: boolean; one_time?: boolean; placeholder?: string; selective?: boolean })`: Returns the final `ReplyKeyboardMarkup` object.
*   `.remove(selective?: boolean)`: Returns a `ReplyKeyboardRemove` object.

## 4. Usage in Framework

The `ctx.reply` and `ctx.editMessageText` methods should be updated to accept an instance of the `Keyboard` builder directly in the `reply_markup` option, in addition to the raw object.

```typescript
// This should be possible
await ctx.reply('Text', { reply_markup: new Keyboard().text('Hi', 'hi') });

// As well as this
const kbd = new Keyboard().text('Hi', 'hi');
await ctx.reply('Text', { reply_markup: kbd });
```
