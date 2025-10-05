import { TelegramClient } from "@bot-machine/telegram-client";
import { vpnOrderFlow } from "./vpn.flow";
import { FlowController, Router, session } from "../../src";

// --- 1. Initialize Client and Router ---

// Make sure to set the BOT_TOKEN environment variable.
const token = process.env.BOT_TOKEN;
if (!token) {
	throw new Error("BOT_TOKEN environment variable is not set!");
}

const client = new TelegramClient(token);
const router = new Router();

// --- 2. Register Middleware ---

// Session middleware is required for flows to work.
router.use(session());

// --- 3. Register Stateless Handlers ---

// The /start command will clear any existing session data and enter the flow.
router.onCommand("start", async (ctx) => {
	// Clear session to ensure a fresh start
	ctx.session = {};
	await ctx.reply("Welcome to the Kaizin VPN Store!");
	await ctx.enterFlow(vpnOrderFlow.name, vpnOrderFlow.states.selectPlan);
});

// --- 4. Register Flows ---

const vpnFlowController = new FlowController(
	vpnOrderFlow.config,
	vpnOrderFlow.name,
);
router.addFlow(vpnFlowController);

// --- 5. Start the Bot ---

console.log("Starting bot...");
client.startPolling((update) => {
	router.handle(update, client);
});

console.log("Bot started successfully!");
