import type {
	InlineKeyboardButton,
	InlineKeyboardMarkup,
	KeyboardButton,
	LoginUrl,
	ReplyKeyboardMarkup,
	ReplyKeyboardRemove,
	WebAppInfo,
} from "@bot-machine/telegram-client/dist/telegram-types";

/**
 * A fluent API for easily creating Telegram keyboards.
 */
export class Keyboard {
	private readonly rows: (InlineKeyboardButton | KeyboardButton)[][] = [[]];

	private get currentRow(): (InlineKeyboardButton | KeyboardButton)[] {
		return this.rows[this.rows.length - 1]!;
	}

	/**
	 * Finalizes the current row and starts a new one.
	 * @returns The Keyboard instance for chaining.
	 */
	public row(): this {
		this.rows.push([]);
		return this;
	}

	// ===============================================================================
	// Inline Keyboard Buttons
	// ===============================================================================

	/**
	 * Adds a standard button that sends a callback query.
	 * @param text The text to display on the button.
	 * @param callback_data The data to send in the callback query when the button is pressed.
	 */
	public text(text: string, callback_data: string): this {
		this.currentRow.push({ text, callback_data });
		return this;
	}

	/**
	 * Adds a button that opens a URL.
	 * @param text The text to display on the button.
	 * @param url The URL to open.
	 */
	public url(text: string, url: string): this {
		this.currentRow.push({ text, url });
		return this;
	}

	/**
	 * Adds a button for a Telegram Login URL.
	 * @param text The text to display on the button.
	 * @param login_url The login URL configuration.
	 */
	public login(text: string, login_url: LoginUrl): this {
		this.currentRow.push({ text, login_url });
		return this;
	}

	/**
	 * Adds a button that prompts the user to switch to a different chat and type the bot's username and a query.
	 * @param text The text to display on the button.
	 * @param query The query to insert.
	 */
	public switchInline(text: string, query: string): this {
		this.currentRow.push({ text, switch_inline_query: query });
		return this;
	}

	/**
	 * Adds a button that inserts the bot's username and a query into the current chat.
	 * @param text The text to display on the button.
	 * @param query The query to insert.
	 */
	public switchInlineCurrent(text: string, query: string): this {
		this.currentRow.push({ text, switch_inline_query_current_chat: query });
		return this;
	}

	/**
	 * Adds a button that launches a Web App.
	 * @param text The text to display on the button.
	 * @param web_app The Web App info.
	 */
	public webApp(text: string, web_app: WebAppInfo): this {
		this.currentRow.push({ text, web_app });
		return this;
	}

	/**
	 * Adds a pay button for Telegram Payments.
	 * @param text The text to display on the button.
	 */
	public pay(text: string): this {
		this.currentRow.push({ text, pay: true });
		return this;
	}

	// ===============================================================================
	// Reply Keyboard Buttons
	// ===============================================================================

	/**
	 * Adds a button that requests the user's contact information when pressed.
	 * @param text The text to display on the button.
	 */
	public requestContact(text: string): this {
		this.currentRow.push({ text, request_contact: true });
		return this;
	}

	/**
	 * Adds a button that requests the user's location when pressed.
	 * @param text The text to display on the button.
	 */
	public requestLocation(text: string): this {
		this.currentRow.push({ text, request_location: true });
		return this;
	}

	/**
	 * Adds a button that allows the user to create and send a poll.
	 * @param text The text to display on the button.
	 * @param type The type of poll to create.
	 */
	public requestPoll(text: string, type?: "quiz" | "regular"): this {
		this.currentRow.push({ text, request_poll: { type } });
		return this;
	}

	// ===============================================================================
	// Output Methods
	// ===============================================================================

	/**
	 * Builds and returns the final `InlineKeyboardMarkup` object.
	 */
	public inline(): InlineKeyboardMarkup {
		return { inline_keyboard: this.rows as InlineKeyboardButton[][] };
	}

	/**
	 * Builds and returns the final `ReplyKeyboardMarkup` object.
	 * @param options Additional options for the reply keyboard.
	 */
	public reply(options?: {
		is_persistent?: boolean;
		resize_keyboard?: boolean;
		one_time_keyboard?: boolean;
		input_field_placeholder?: string;
		selective?: boolean;
	}): ReplyKeyboardMarkup {
		return { keyboard: this.rows, ...options };
	}

	/**
	 * Builds and returns a `ReplyKeyboardRemove` object to remove the reply keyboard.
	 * @param selective Whether to remove the keyboard for specific users only.
	 */
	public static remove(selective?: boolean): ReplyKeyboardRemove {
		return { remove_keyboard: true, selective };
	}
}
