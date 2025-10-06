import type { ILogger } from "./logger";
import type {
	Chat,
	InlineKeyboardButton,
	Message,
	TelegramClient,
	Update,
	User,
} from "@bot-machine/telegram-client";
import type { Router } from "./router";

//================================================================================
// Core Application
//================================================================================

/**
 * The main context object passed to handlers and middleware.
 * It provides an abstraction over the Telegram update, methods to reply, and state management.
 */
export interface AppContext {
	/** The raw update object from the Telegram API. */
	readonly update: Update;
	/** The Telegram client instance for making API calls. */
	readonly client: TelegramClient;
	/** The logger instance. */
	logger: ILogger;
	/** The router instance, used internally for flow control. */
	readonly router: Router;
	/** The user who initiated the update. */
	readonly from: User | undefined;
	/** The chat where the update originated. */
	readonly chat: Chat | undefined;

	/** Session data for the current user, persisted between updates. */
	session: Record<string, any>;

	/** State for the current request, passed between middleware but not persisted. */
	state: Record<string, any>;

	/** Parameters extracted from the route pattern (e.g., from `action::id`). */
	params: Record<string, string>;

	/**
	 * Sends a new message to the chat.
	 * @param text The message text.
	 * @param extra Additional parameters for the Telegram API `sendMessage` method.
	 */
	reply(text: string, extra?: any): Promise<Message>;

	/**
	 * Edits the text of the message associated with the current update.
	 * Typically used in response to a `callback_query`.
	 * @param text The new message text.
	 * @param extra Additional parameters for the Telegram API `editMessageText` method.
	 */
	editMessageText(text: string, extra?: any): Promise<Message | boolean>;

	/**
	 * Deletes the message associated with the current update.
	 */
	deleteMessage(): Promise<boolean>;

	/**
	 * Answers a callback query, typically to dismiss the loading state on a button.
	 * @param text Optional text to show in a notification to the user.
	 */
	answerCallbackQuery(text?: string): Promise<boolean>;

	/**
	 * Enters a stateful flow.
	 * @param flowName The name of the flow to enter.
	 * @param initialState The initial state within the flow (defaults to 'index').
	 */
	enterFlow(flowName: string, initialState?: string): Promise<void>;
}

/**
 * An asynchronous function that processes an update for a stateless route.
 * @param ctx The application context for the current update.
 */
export type Handler = (ctx: AppContext) => Promise<void>;

/**
 * An asynchronous function that can process an update before it reaches the main handler.
 * @param ctx The application context for the current update.
 * @param next A function to call to pass control to the next middleware in the chain.
 */
export type Middleware = (
	ctx: AppContext,
	next: () => Promise<void>,
) => Promise<void>;

//================================================================================
// Flow Controller
//================================================================================

/**
 * Describes the payload for a message to be sent to Telegram.
 * This is the return type for a Component function.
 */
export interface MessagePayload {
	/** The text content of the message. */
	text: string;
	/** The parse mode for the message text (e.g., 'HTML'). */
	parse_mode?: "HTML" | "MarkdownV2";
	/** The inline keyboard markup for the message. */
	reply_markup?: {
		inline_keyboard: InlineKeyboardButton[][];
	};
}

/**
 * A UI component function.
 * It receives props and returns a `MessagePayload` that describes the message to be rendered.
 * @param props The data required for the component to render.
 */
export type Component = (props: any) => Promise<MessagePayload>;

import { z, type ZodType } from "zod";

// ... (imports)

// ... (AppContext, Handler, Middleware, MessagePayload, Component)

//================================================================================
// Business Logic Core
//================================================================================

/**
 * Represents a business logic query with defined input and output schemas.
 */
export interface BotQuery<TInput extends ZodType, TOutput extends ZodType> {
	_id: "BotQuery";
	name: string;
	input: TInput;
	output: TOutput;
	execute: (
		input: z.infer<TInput>,
		ctx: AppContext,
	) => Promise<z.infer<TOutput>>;
}

/**
 * Represents a business logic command with defined input and output schemas.
 */
export interface BotCommand<TInput extends ZodType, TOutput extends ZodType> {
	_id: "BotCommand";
	name: string;
	input: TInput;
	output: TOutput;
	execute: (
		input: z.infer<TInput>,
		ctx: AppContext,
	) => Promise<z.infer<TOutput>>;
}

/**
 * Defines an action to be taken in response to a user interaction within a flow state.
 */
export interface ActionHandler {
	/** The business logic command to execute. */
	command: BotCommand<any, any>;
	/** The next state to transition to. Can be a static string or a function of the command's result. */
	nextState?: string | ((result: any) => string);
	/** If true, re-renders the current state with the result of the command, instead of transitioning. */
	refresh?: boolean;
}

/**
 * Defines a single state within a stateful flow.
 */
export interface FlowState {
	/** The UI component to render for this state. */
	component: Component;
	/** An optional query to execute to fetch data when entering this state. The result is passed to the component as props. */
	onEnter?: BotQuery<any, any>;
	/** A map of handlers for callback query actions. The key is a string (e.g., 'action::id') or a RegExp. */
	onAction?: Record<string, ActionHandler>;
	/** A map of handlers for text messages. The key is a string (e.g., ':name') or a RegExp. */
	onText?: Record<string, ActionHandler>;
}

/**
 * The complete configuration for a state machine, mapping state names to `FlowState` definitions.
 */
export type FlowConfig = Record<string, FlowState>;

/**
 * A type-safe definition of a flow, returned by the `createFlow` factory.
 */
export interface FlowDefinition<TConfig extends FlowConfig> {
	name: string;
	config: TConfig;
	states: { [K in keyof TConfig]: K };
}

//================================================================================
// Session Management
//================================================================================

/**
 * Defines the contract for a session store, allowing for pluggable persistence.
 */
export interface ISessionStore {
	/**
	 * Retrieves a session for a given key.
	 * @param key The unique session key (usually the user ID).
	 * @returns The session data, or `undefined` if not found.
	 */
	get(key: string): Promise<Record<string, any> | undefined>;

	/**
	 * Saves a session for a given key.
	 * @param key The unique session key.
	 * @param value The session data to save.
	 */
	set(key: string, value: Record<string, any>): Promise<void>;

	/**
	 * Deletes a session for a given key.
	 * @param key The unique session key.
	 */
	delete(key: string): Promise<void>;
}
