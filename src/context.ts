import type {
	Update,
	TelegramClient,
	User,
	Chat,
	Message,
} from "@bot-machine/telegram-client";
import type { AppContext } from "./types";
import type { Router } from "./router";
import { FormattedText } from "./text";
import { Keyboard } from "./keyboard";

/**
 * The concrete implementation of the AppContext interface.
 * It provides an abstraction over the Telegram update, methods to reply, and state management.
 * @internal
 */
export class BotContext implements AppContext {
	public session: Record<string, any> = {};
	public state: Record<string, any> = {};
	public params: Record<string, string> = {};

	constructor(
		public readonly client: TelegramClient,
		public readonly update: Update,
		public readonly router: Router,
	) {}

	get from(): User | undefined {
		return this.update.message?.from ?? this.update.callback_query?.from;
	}

	get chat(): Chat | undefined {
		return (
			this.update.message?.chat ?? this.update.callback_query?.message?.chat
		);
	}

	private get message(): Message | undefined {
		return this.update.message ?? this.update.callback_query?.message;
	}

	async reply(text: string | FormattedText, extra?: any): Promise<Message> {
		if (!this.chat) {
			throw new Error("Cannot reply when chat is not defined");
		}

		const payload = {
			chat_id: this.chat.id,
			text: "",
			parse_mode: undefined,
			...extra,
		};

		if (text instanceof FormattedText) {
			payload.text = text.text;
			payload.parse_mode = text.parseMode;
		} else {
			payload.text = text;
		}

		if (extra?.reply_markup instanceof Keyboard) {
			payload.reply_markup = extra.reply_markup.inline();
		}

		return this.client.sendMessage(payload);
	}

	async editMessageText(
		text: string | FormattedText,
		extra?: any,
	): Promise<Message | boolean> {
		if (!this.chat || !this.message) {
			throw new Error(
				"Cannot edit message when chat or message is not defined",
			);
		}

		const payload = {
			chat_id: this.chat.id,
			message_id: this.message.message_id,
			text: "",
			parse_mode: undefined,
			...extra,
		};

		if (text instanceof FormattedText) {
			payload.text = text.text;
			payload.parse_mode = text.parseMode;
		} else {
			payload.text = text;
		}

		if (extra?.reply_markup instanceof Keyboard) {
			payload.reply_markup = extra.reply_markup.inline();
		}

		return this.client.editMessageText(payload);
	}

	async deleteMessage(): Promise<boolean> {
		if (!this.chat || !this.message) {
			throw new Error(
				"Cannot delete message when chat or message is not defined",
			);
		}
		return this.client.deleteMessage({
			chat_id: this.chat.id,
			message_id: this.message.message_id,
		});
	}

	async answerCallbackQuery(text?: string): Promise<boolean> {
		if (!this.update.callback_query) {
			throw new Error(
				"Cannot answer callback query when callback_query is not defined",
			);
		}
		const result = await this.client.answerCallbackQuery({
			callback_query_id: this.update.callback_query.id,
			text,
		});
		return result as unknown as boolean;
	}

	async enterFlow(
		flowName: string,
		initialState: string = "index",
	): Promise<void> {
		if (!this.session) {
			this.session = {};
		}
		this.session.flowName = flowName;
		this.session.flowState = initialState;
		// Re-run the routing logic to immediately render the initial state of the new flow.
		await this.router.route(this);
	}
}
