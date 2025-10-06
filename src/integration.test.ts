import { describe, test, expect, mock } from "bun:test";
import { Router } from "./router";
import { FlowController, createFlow } from "./flow";
import type {
	AppContext,
	FlowConfig,
	FlowState,
	BotCommand,
	BotQuery,
	Component,
	ActionHandler,
	MessagePayload,
} from "./types";
import type { Update } from "@bot-machine/telegram-client";
import { BotContext } from "./context";

// Mock data and helpers
const createMockContext = (update: Partial<Update> = {}): BotContext => {
	const mockClient = {} as any;
	// Mock the router to prevent cycles, e.g. if enterFlow calls route
	const mockRouter = { route: mock(async () => {}) } as any;

	// Create a real BotContext instance
	const ctx = new BotContext(mockClient, update as Update, mockRouter);

	// The tests expect to be able to spy on these methods, so we replace them with mocks.
	ctx.reply = mock(async () => ({}) as any);
	ctx.editMessageText = mock(async () => ({}) as any);
	ctx.deleteMessage = mock(async () => true);
	ctx.answerCallbackQuery = mock(async () => true);
	ctx.enterFlow = mock(async () => {});

	// The tests also manually set session, so we should initialize it.
	ctx.session = {};

	return ctx;
};

// Mock command and query helpers
const createMockCommand = (
	executeFn: any = mock(async (input: any) => ({})),
	inputSchema: any = { parse: mock((x: any) => x) },
	outputSchema: any = { parse: mock((x: any) => x) },
): BotCommand<any, any> => {
	return {
		_id: "BotCommand",
		name: "mockCommand",
		input: inputSchema,
		output: outputSchema,
		execute: executeFn,
	};
};

const createMockQuery = (
	executeFn: any = mock(async (input: any) => ({})),
	inputSchema: any = { parse: mock((x: any) => x) },
	outputSchema: any = { parse: mock((x: any) => x) },
): BotQuery<any, any> => {
	return {
		_id: "BotQuery",
		name: "mockQuery",
		input: inputSchema,
		output: outputSchema,
		execute: executeFn,
	};
};

const createMockComponent = (renderResult: MessagePayload): Component => {
	return mock(async (props: any) => renderResult) as Component;
};

describe("Router and Flow Integration", () => {
	test("should allow router to delegate to flow when user is in flow", async () => {
		// Create a simple flow with two states
		const mockCommand = createMockCommand(
			mock(async (input: any) => ({ name: input.name })),
		);
		const mockComponent = createMockComponent({
			text: "Enter your name:",
			reply_markup: { inline_keyboard: [] },
		});

		const config: FlowConfig = {
			getName: {
				component: mockComponent,
				onText: {
					":name": {
						command: mockCommand,
						nextState: "greet",
					} as ActionHandler,
				},
			} as FlowState,
			greet: {
				component: mockComponent,
			} as FlowState,
		};

		const flowController = new FlowController(config, "getNameFlow");
		const flowDefinition = createFlow("getNameFlow", config);

		// Create router and register the flow
		const router = new Router();
		router.addFlow(flowController);

		// Create context with user in the flow
		const ctx = createMockContext({ message: { text: "John" } as any });
		ctx.session.flowName = "getNameFlow";
		ctx.session.flowState = "getName";

		// Handle the update
		await router.route(ctx);

		// Verify that the flow handled the update (transitioned to next state)
		expect(ctx.session.flowState).toBe("greet");
		expect(mockCommand.execute).toHaveBeenCalledWith(
			{ name: "John", text: "John" },
			ctx,
		);
	});

	test("should allow router to handle non-flow routes when user is NOT in a flow", async () => {
		// Create a flow (but user won't be in it)
		const mockFlowCommand = createMockCommand(mock(async (input: any) => ({})));
		const mockFlowComponent = createMockComponent({ text: "Flow state" });

		const flowConfig: FlowConfig = {
			flowState: {
				component: mockFlowComponent,
				onText: {
					"flow-specific": {
						command: mockFlowCommand,
						nextState: "flowState",
					} as ActionHandler,
				},
			} as FlowState,
		};

		const flowController = new FlowController(flowConfig, "testFlow");

		// Create a router with both flow and regular command
		const router = new Router();
		router.addFlow(flowController);

		const mockCmdHandler = mock(async (ctx: AppContext) => {
			await ctx.reply("Regular command response");
		});
		router.onCommand("help", mockCmdHandler);

		// Create context where user is NOT in any flow
		const ctx = createMockContext({ message: { text: "/help" } as any });
		// No flowName in session

		// Handle the update
		await router.route(ctx);

		// Verify that the regular command handler was called
		expect(mockCmdHandler).toHaveBeenCalled();
	});

	test("should properly transition between flow states when triggered from router", async () => {
		const setNameCommand = createMockCommand(
			mock(async (input: any) => ({ name: input.name })),
		);
		const finishCommand = createMockCommand(mock(async (input: any) => ({})));
		const nameComponent = createMockComponent({ text: "What's your name?" });
		const finishedComponent = createMockComponent({ text: "Thank you!" });

		const config: FlowConfig = {
			getName: {
				component: nameComponent,
				onText: {
					":name": {
						command: setNameCommand,
						nextState: "finish",
					} as ActionHandler,
				},
			} as FlowState,
			finish: {
				component: finishedComponent,
				onAction: {
					done: {
						command: finishCommand,
						nextState: undefined, // Exit flow
					} as ActionHandler,
				},
			} as FlowState,
		};

		const flowController = new FlowController(config, "transitionFlow");
		const router = new Router();
		router.addFlow(flowController);

		// Step 1: Enter name
		const ctx1 = createMockContext({ message: { text: "Alice" } as any });
		ctx1.session.flowName = "transitionFlow";
		ctx1.session.flowState = "getName";

		await router.route(ctx1);

		expect(ctx1.session.flowState).toBe("finish");
		expect(setNameCommand.execute).toHaveBeenCalledWith(
			{ name: "Alice", text: "Alice" },
			ctx1,
		);

		// Step 2: Complete flow via callback
		const ctx2 = createMockContext({ callback_query: { data: "done" } as any });
		ctx2.session.flowName = "transitionFlow";
		ctx2.session.flowState = "finish";

		await router.route(ctx2);

		expect(ctx2.session.flowName).toBeUndefined(); // Flow should be exited
		expect(ctx2.session.flowState).toBeUndefined();
	});

	test("should re-render current state when user is in flow but no matching actions", async () => {
		// Create a flow that handles specific patterns
		const mockFlowCommand = createMockCommand(mock(async (input: any) => ({})));
		const mockFlowComponent = createMockComponent({ text: "Flow message" });

		const flowConfig: FlowConfig = {
			activeState: {
				component: mockFlowComponent,
				onAction: {
					"flow-button": {
						command: mockFlowCommand,
						nextState: "activeState",
					} as ActionHandler,
				},
			} as FlowState,
		};

		const flowController = new FlowController(flowConfig, "activeFlow");

		// Create router with a command that should not interfere with flow
		const router = new Router();
		router.addFlow(flowController);

		const generalHandler = mock(async (ctx: AppContext) => {
			await ctx.reply("General message");
		});
		router.onText("general", generalHandler);

		// Context where user is in flow but sends text that doesn't match flow patterns
		const ctx = createMockContext({ message: { text: "general" } as any });
		ctx.session.flowName = "activeFlow";
		ctx.session.flowState = "activeState";

		await router.route(ctx);

		// The flow should re-render the current state (no general handler should be called since flow handles it)
		expect(generalHandler).not.toHaveBeenCalled();
		// Flow state should remain unchanged but the component should have been rendered
		expect(ctx.session.flowState).toBe("activeState");
		expect(mockFlowComponent).toHaveBeenCalledWith({});
	});

	test("should handle concurrent users in different flows correctly", async () => {
		// Flow 1
		const flow1Command = createMockCommand(
			mock(async (input: any) => ({ result: "flow1" })),
		);
		const flow1Component = createMockComponent({ text: "Flow 1 state" });
		const flow1Config: FlowConfig = {
			state1: {
				component: flow1Component,
				onText: {
					flow1: {
						command: flow1Command,
						nextState: "state1",
					} as ActionHandler,
				},
			} as FlowState,
		};
		const flow1Controller = new FlowController(flow1Config, "flow1");

		// Flow 2
		const flow2Command = createMockCommand(
			mock(async (input: any) => ({ result: "flow2" })),
		);
		const flow2Component = createMockComponent({ text: "Flow 2 state" });
		const flow2Config: FlowConfig = {
			state2: {
				component: flow2Component,
				onText: {
					flow2: {
						command: flow2Command,
						nextState: "state2",
					} as ActionHandler,
				},
			} as FlowState,
		};
		const flow2Controller = new FlowController(flow2Config, "flow2");

		// Router with both flows
		const router = new Router();
		router.addFlow(flow1Controller);
		router.addFlow(flow2Controller);

		// User 1 in flow 1
		const ctx1 = createMockContext({
			message: { text: "flow1", from: { id: 1 } as any } as any,
		});
		ctx1.session.flowName = "flow1";
		ctx1.session.flowState = "state1";

		// User 2 in flow 2
		const ctx2 = createMockContext({
			message: { text: "flow2", from: { id: 2 } as any } as any,
		});
		ctx2.session.flowName = "flow2";
		ctx2.session.flowState = "state2";

		// Process both updates
		await router.route(ctx1);
		await router.route(ctx2);

		// Both commands should have been executed
		expect(flow1Command.execute).toHaveBeenCalledWith({ text: "flow1" }, ctx1);
		expect(flow2Command.execute).toHaveBeenCalledWith({ text: "flow2" }, ctx2);

		// Each user should remain in their respective flow
		expect(ctx1.session.flowName).toBe("flow1");
		expect(ctx2.session.flowName).toBe("flow2");
	});
});
