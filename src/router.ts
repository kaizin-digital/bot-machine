import { TelegramClient, type Update } from "@bot-machine/telegram-client";
import { BotContext } from "./context";
import type { Handler, Middleware } from "./types";
import { FlowController } from "./flow";
import { pathStringToRegex } from "./utils";

/** @internal */
interface Route {
	pattern: RegExp;
	handler: Handler;
	paramNames?: string[]; // Store parameter names for string patterns
}

/**
 * The main router for the application.
 * It dispatches updates to the appropriate handlers, middleware, and flow controllers.
 */
export class Router {
	private commandRoutes: Route[] = [];
	private callbackQueryRoutes: Route[] = [];
	private textRoutes: Route[] = [];
	private middlewares: Middleware[] = [];
	private flows: Record<string, FlowController> = {};

	/**
	 * Registers a handler for a slash command.
	 * @param command The command name (without the slash) or a RegExp to match against the message text.
	 * @param handler The function to execute when the command matches.
	 */
	public onCommand(command: string | RegExp, handler: Handler) {
		const pattern =
			command instanceof RegExp
				? command
				: new RegExp(`^/${command}(?:@\\w+)?(?:\\s+(.*))?$`);
		const route: Route = { pattern, handler };
		if (typeof command === "string") {
			route.paramNames = this.extractParamNames(command);
		}
		this.commandRoutes.push(route);
	}

	/**
	 * Registers a handler for a callback query from an inline keyboard.
	 * @param pattern A string (e.g., 'action::id'), or a RegExp to match against the callback_data.
	 * @param handler The function to execute when the pattern matches.
	 */
	public onCallbackQuery(pattern: string | RegExp, handler: Handler) {
		const re =
			typeof pattern === "string" && pattern.includes(":")
				? pathStringToRegex(pattern)
				: new RegExp(pattern);
		const route: Route = { pattern: re, handler };
		if (typeof pattern === "string") {
			route.paramNames = this.extractParamNames(pattern);
		}
		this.callbackQueryRoutes.push(route);
	}

	/**
	 * Registers a handler for a text message.
	 * @param pattern A string (e.g., 'hello :name') or a RegExp to match against the message text.
	 * @param handler The function to execute when the pattern matches.
	 */
	public onText(pattern: string | RegExp, handler: Handler) {
		const re =
			typeof pattern === "string" && pattern.includes(":")
				? pathStringToRegex(pattern)
				: new RegExp(pattern);
		const route: Route = { pattern: re, handler };
		if (typeof pattern === "string") {
			route.paramNames = this.extractParamNames(pattern);
		}
		this.textRoutes.push(route);
	}

	/**
	 * Registers a stateful flow controller.
	 * @param flow The `FlowController` instance to add.
	 */
	public addFlow(flow: FlowController) {
		this.flows[flow.name] = flow;
	}

	/**
	 * Registers a middleware function to be executed for every update.
	 * @param middleware The middleware function.
	 */
	public use(middleware: Middleware) {
		this.middlewares.push(middleware);
	}

	/**
	 * The main entry point for handling an update from the Telegram API.
	 * It creates a context, runs middleware, and then delegates to the internal router.
	 * @internal
	 */
	public async handle(update: Update, client: TelegramClient) {
		const ctx = new BotContext(client, update, this);

		let nextFn = async () => {
			await this.route(ctx);
		};

		for (let i = this.middlewares.length - 1; i >= 0; i--) {
			const middleware = this.middlewares[i];
			const currentNextFn = nextFn; // Capture current nextFn
			nextFn = () => middleware!(ctx, currentNextFn);
		}

		try {
			await nextFn();
		} catch (e) {
			console.error("Error handling update:", e);
		}
	}

	/**
	 * The internal routing logic.
	 * It first checks if a flow should handle the update, then checks stateless routes.
	 * @internal
	 */
	public async route(ctx: BotContext) {
		const { update } = ctx;

		// If the user is in a flow, delegate to the flow controller first.
		if (ctx.session.flowName) {
			const flow = this.flows[ctx.session.flowName];
			if (flow) {
				const handled = await flow.handle(ctx);
				if (handled) return; // If the flow handled it, we're done.
			}
		}

		// Otherwise, try to match stateless routes.
		if (update.message?.text) {
			if (
				await this.processRoutes(this.commandRoutes, update.message.text, ctx)
			)
				return;
			if (await this.processRoutes(this.textRoutes, update.message.text, ctx))
				return;
		}

		if (update.callback_query?.data) {
			if (
				await this.processRoutes(
					this.callbackQueryRoutes,
					update.callback_query.data,
					ctx,
				)
			)
				return;
		}
	}

	/** @internal */
	private extractParamNames(patternStr: string): string[] {
		const paramNames: string[] = [];
		const regex = /:(\w+)/g;
		let match;
		while ((match = regex.exec(patternStr)) !== null) {
			paramNames.push(match[1] || "");
		}
		return paramNames;
	}

	/** @internal */
	private async processRoutes(
		routes: Route[],
		text: string,
		ctx: BotContext,
	): Promise<boolean> {
		for (const route of routes) {
			const match = text.match(route.pattern);
			if (match) {
				// Use groups if available (for named captures), otherwise map positional captures to parameter names
				if (match.groups) {
					ctx.params = match.groups;
				} else {
					// For positional captures from string patterns like ':action:::id',
					// map them to their original parameter names
					ctx.params = {};
					if (route.paramNames && match.length > 1) {
						for (
							let i = 0;
							i < route.paramNames.length && i + 1 < match.length;
							i++
						) {
							const paramName = route.paramNames[i];
							if (paramName) {
								ctx.params[paramName] = match[i + 1] || "";
							}
						}
					}
				}
				await route.handler(ctx);
				return true;
			}
		}
		return false;
	}
}
