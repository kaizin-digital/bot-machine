# API: App Context (`ctx`)

The `AppContext` is an interface representing the context of a single update. The concrete class implementing it is `BotContext`. An instance of this context is passed to every handler, middleware, and business logic function.

## Properties

-   **`update: Update`**: The raw `Update` object from the `@bot-machine/telegram-client` library.

-   **`client: TelegramClient`**: The `TelegramClient` instance used to make API calls.

-   **`router: Router`**: The `Router` instance handling the update. Used internally for `enterFlow`.

-   **`from: User | undefined`**: A shortcut to the `User` who initiated the update.

-   **`chat: Chat | undefined`**: A shortcut to the `Chat` where the update originated.

-   **`session: Record<string, any>`**: A key-value object for persisting data for the current user across multiple updates. Requires `session()` middleware.

-   **`params: Record<string, string>`**: An object containing named parameters extracted from a matched route pattern (e.g., from `'action::id'`).

## Methods

### `reply(text, extra?)`

Sends a new message to the chat.

-   **`text: string | FormattedText`**: The text to send. Can be a plain string or a `FormattedText` object from the `format()` helper.
-   **`extra?: any`**: Additional parameters for the Telegram API `sendMessage` method (e.g., `{ reply_markup: ... }`).
-   **Returns**: `Promise<Message>`

### `editMessageText(text, extra?)`

Edits the text of the message associated with the current update (usually from a `callback_query`).

-   **`text: string | FormattedText`**: The new message text.
-   **`extra?: any`**: Additional parameters for the Telegram API `editMessageText` method.
-   **Returns**: `Promise<Message | boolean>`

### `deleteMessage()`

Deletes the message associated with the current update.

-   **Returns**: `Promise<boolean>`

### `answerCallbackQuery(text?)`

Answers a callback query to dismiss the loading state on a button.

-   **`text?: string`**: Optional text to show in a notification to the user.
-   **Returns**: `Promise<boolean>`

### `enterFlow(flowName, initialState?)`

Transitions the user into a stateful flow.

-   **`flowName: string`**: The name of the flow to enter (must match the name provided to `createFlow`).
-   **`initialState?: string`**: The name of the initial state within the flow to start at. Defaults to `'index'`.
-   **Returns**: `Promise<void>`
