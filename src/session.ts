import type { AppContext, Middleware, ISessionStore } from "./types";

/**
 * A simple in-memory session store that uses a `Map`.
 * This is the default store if no other is provided.
 * It is not recommended for production use as it will lose all data on restart.
 */
class InMemorySessionStore implements ISessionStore {
	private readonly store = new Map<string, Record<string, any>>();

	/** @inheritdoc */
	async get(key: string): Promise<Record<string, any> | undefined> {
		return this.store.get(key);
	}

	/** @inheritdoc */
	async set(key: string, value: Record<string, any>): Promise<void> {
		this.store.set(key, value);
	}

	/** @inheritdoc */
	async delete(key: string): Promise<void> {
		this.store.delete(key);
	}
}

/**
 * Options for configuring the session middleware.
 */
interface SessionOptions {
	/** An object that implements the `ISessionStore` interface for persisting sessions. Defaults to `InMemorySessionStore`. */
	store?: ISessionStore;
}

/**
 * Creates a session middleware for the router.
 * This middleware loads `ctx.session` before handlers are executed
 * and saves it after they have completed.
 * @param options Configuration options for the session.
 */
export function session(options?: SessionOptions): Middleware {
	const store = options?.store ?? new InMemorySessionStore();

	return async (ctx: AppContext, next: () => Promise<void>) => {
		const userId = ctx.from?.id;
		if (!userId) {
			// No user, no session. Useful for channel posts, etc.
			ctx.session = {};
			await next();
			return;
		}

		const key = userId.toString();
		const sessionData = await store.get(key);
		const sessionExists = !!sessionData;

		ctx.session = sessionData ?? {};

		await next();

		// Save or delete session after all handlers have run.
		const isSessionEmpty = Object.keys(ctx.session).length === 0;

		if (isSessionEmpty) {
			// Only delete the session if it existed before.
			if (sessionExists) {
				await store.delete(key);
			}
		} else {
			await store.set(key, ctx.session);
		}
	};
}
