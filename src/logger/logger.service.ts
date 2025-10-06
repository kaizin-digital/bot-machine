import pino from "pino";
import type { ILogger } from "./logger.interface";

// TODO: Move isDevelopment to a global config
const isDevelopment = process.env.NODE_ENV !== "production";

const pinoConfig = isDevelopment
	? {
			transport: {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
				},
			},
		}
	: {};

export const createLogger = (options: pino.LoggerOptions = {}): ILogger => {
	return pino({ ...pinoConfig, ...options });
};
