import { TelegramClient, type Update } from "@bot-machine/telegram-client";
import { z } from "zod";
import { Router } from "../../src/router";
import { createLogger } from "../../src/logger";
import { loggingMiddleware } from "../../src/middleware/logging.middleware";
import { createCommand } from "../../src/core";

// 1. Создаем простую команду, чтобы продемонстрировать логирование бизнес-логики
const startCommand = createCommand({
	name: "demo.start",
	input: z.object({}),
	output: z.object({}),
	execute: async (_, ctx) => {
		    await ctx.reply(
		      `Hello, ${ctx.from?.first_name} 👋\nYour request has been logged with Update ID: ${ctx.update.update_id}`,
		    );		return {};
	},
});

async function main() {
	// 2. Получаем токен из переменных окружения
	const token = process.env.BOT_TOKEN;
	if (!token) {
		console.error("Error: BOT_TOKEN environment variable is not set.");
		process.exit(1);
	}

	// 3. Создаем основной экземпляр логера
	const logger = createLogger();

	logger.info("Starting bot...");

	// 4. Создаем роутер и передаем в него логер
	const router = new Router({ logger });

	// 5. Регистрируем наш middleware для логирования запросов
	router.use(loggingMiddleware());

	// 6. Регистрируем обработчик для команды /start
	router.onCommand("start", async (ctx) => {
		// Внутри обработчика вызываем нашу логируемую команду
		await startCommand.execute({}, ctx);
	});

	// 7. Создаем клиент Telegram
	const client = new TelegramClient(token);

	// 8. Запускаем long-polling
	logger.info("Bot is polling for updates...");
	await client.startPolling((update: Update) => {
		// Передаем каждое обновление в роутер
		router.handle(update, client).catch((err) => {
			logger.error(err, "Error in router.handle");
		});
	});
}

main().catch((err) => {
	// Фоллбэк-логер на случай, если основной не создался
	const fallbackLogger = createLogger();
	fallbackLogger.fatal(err, "A fatal error occurred in the main function.");
	process.exit(1);
});
