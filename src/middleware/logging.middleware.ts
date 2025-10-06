import type { AppContext, Middleware } from "../types";

export const loggingMiddleware = (): Middleware => {
	return async (ctx: AppContext, next: () => Promise<void>) => {
		const startTime = Date.now();

		// Create a child logger for this specific request to trace all subsequent logs
		const requestLogger = ctx.logger.child({ updateId: ctx.update.update_id });
		// eslint-disable-next-line no-param-reassign
		ctx.logger = requestLogger;

		ctx.logger.info({ update: ctx.update }, `[Request] Start processing`);

		try {
			await next();
			const duration = Date.now() - startTime;
			ctx.logger.info({ duration }, `[Request] Processed successfully`);
		} catch (error) {
			const duration = Date.now() - startTime;
			ctx.logger.error({ duration, error }, `[Request] Processing failed`);
			// Re-throw the error to allow other error handlers to process it
			throw error;
		}
	};
};
