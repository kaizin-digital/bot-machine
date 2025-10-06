import { z } from "zod";
import { createCommand as createRealCommand } from "./core";
import { describe, test, expect, mock } from "bun:test";
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
import { pathStringToRegex } from "./utils";
import type { Update } from "@bot-machine/telegram-client";

// Mock data and helpers
const createMockContext = (update: Partial<Update> = {}): AppContext => {
	const mockLogger = {
		info: mock(() => {}),
		error: mock(() => {}),
		debug: mock(() => {}),
		warn: mock(() => {}),
		fatal: mock(() => {}),
		child: mock(() => mockLogger),
	} as any;

	return {
		update: update as Update,
		client: {} as any,
		router: {} as any,
		from: update.message?.from,
		chat: update.message?.chat,
		session: {},
		state: {},
		params: {},
		logger: mockLogger,
		reply: mock(async () => ({}) as any),
		editMessageText: mock(async () => ({}) as any),
		deleteMessage: mock(async () => true),
		answerCallbackQuery: mock(async () => true),
		enterFlow: mock(async () => {}),
	} as AppContext;
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

describe("FlowController", () => {
	describe("constructor", () => {
		test("should create a new FlowController with the provided config and name", () => {
			const config: FlowConfig = {};
			const flowController = new FlowController(config, "testFlow");

			expect(flowController.name).toBe("testFlow");
			expect((flowController as any).config).toBe(config);
		});
	});

	describe("handle", () => {
		test("should return false if the context is not in this flow", async () => {
			const config: FlowConfig = {};
			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext();

			const result = await flowController.handle(ctx);

			expect(result).toBe(false);
		});

		test("should exit the flow and return false if the current state doesn't exist", async () => {
			const config: FlowConfig = {};
			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext();
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "nonexistent";

			const result = await flowController.handle(ctx);

			expect(result).toBe(false);
			expect(ctx.session.flowName).toBeUndefined();
			expect(ctx.session.flowState).toBeUndefined();
		});

		test("should render the current state if no actions are triggered", async () => {
			const mockComponent = createMockComponent({ text: "Test state" });
			const config: FlowConfig = {
				initial: {
					component: mockComponent,
				} as FlowState,
			};
			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({ message: { text: "something" } as any });
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "initial";

			const result = await flowController.handle(ctx);

			expect(result).toBe(true);
			expect(mockComponent).toHaveBeenCalledWith({});
			expect(ctx.reply).toHaveBeenCalledWith("Test state", {
				reply_markup: undefined,
			});
		});

		test("should process callback query actions", async () => {
			const executeMock = mock(async (input: any) => ({ result: "success" }));
			const mockCommand = createMockCommand(executeMock);
			const mockComponent = createMockComponent({ text: "Next state" });

			const config: FlowConfig = {
				initial: {
					component: mockComponent,
					onAction: {
						"action:::id": {
							command: mockCommand,
							nextState: "nextState",
						} as ActionHandler,
					},
				} as FlowState,
				nextState: {
					component: mockComponent,
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				callback_query: { data: "action::123" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "initial";

			const result = await flowController.handle(ctx);

			expect(result).toBe(true);
			expect(executeMock).toHaveBeenCalled();
			expect(ctx.session.flowState).toBe("nextState");
		});

		test("should process text message actions", async () => {
			const executeMock = mock(async (input: any) => ({ result: "success" }));
			const mockCommand = createMockCommand(executeMock);
			const mockComponent = createMockComponent({ text: "Next state" });

			const config: FlowConfig = {
				initial: {
					component: mockComponent,
					onText: {
						"hello :name": {
							command: mockCommand,
							nextState: "greeted",
						} as ActionHandler,
					},
				} as FlowState,
				greeted: {
					component: mockComponent,
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				message: { text: "hello world" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "initial";

			const result = await flowController.handle(ctx);

			expect(result).toBe(true);
			expect(executeMock).toHaveBeenCalled();
			expect(ctx.params).toEqual({ name: "world" });
			expect(ctx.session.flowState).toBe("greeted");
		});

		test("should update params when processing patterns", async () => {
			const mockCommand = createMockCommand(async (input: any) => ({
				result: "success",
			}));
			const mockComponent = createMockComponent({ text: "Test state" });

			const config: FlowConfig = {
				initial: {
					component: mockComponent,
					onAction: {
						"user:::id": {
							command: mockCommand,
							nextState: "initial",
						} as ActionHandler,
					},
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				callback_query: { data: "user::456" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "initial";

			await flowController.handle(ctx);

			expect(ctx.params).toEqual({ id: "456" });
		});

		test("should refresh the current state when action has refresh option", async () => {
			const mockCommand = createMockCommand(async (input: any) => ({
				result: "success",
			}));
			const mockComponent = createMockComponent({ text: "Refreshed state" });

			const config: FlowConfig = {
				currentState: {
					component: mockComponent,
					onAction: {
						refresh: {
							command: mockCommand,
							refresh: true,
						} as ActionHandler,
					},
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				callback_query: { data: "refresh" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "currentState";

			await flowController.handle(ctx);

			expect(ctx.session.flowState).toBe("currentState"); // Same state after refresh
		});

		test("should exit flow when no next state is specified", async () => {
			const mockCommand = createMockCommand(async (input: any) => ({
				result: "success",
			}));
			const mockComponent = createMockComponent({ text: "End state" });

			const config: FlowConfig = {
				currentState: {
					component: mockComponent,
					onAction: {
						exit: {
							command: mockCommand,
							// No nextState or refresh - should exit
						} as ActionHandler,
					},
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				callback_query: { data: "exit" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "currentState";

			await flowController.handle(ctx);

			expect(ctx.session.flowName).toBeUndefined();
			expect(ctx.session.flowState).toBeUndefined();
		});

		test("should use function to determine next state based on result", async () => {
			const mockCommand = createMockCommand(async (input: any) => ({
				goToNext: true,
			}));
			const mockComponent = createMockComponent({ text: "Next state" });

			const config: FlowConfig = {
				initial: {
					component: mockComponent,
					onAction: {
						conditional: {
							command: mockCommand,
							nextState: (result: any) =>
								result.goToNext ? "nextState" : "stayHere",
						} as ActionHandler,
					},
				} as FlowState,
				nextState: {
					component: mockComponent,
				} as FlowState,
				stayHere: {
					component: mockComponent,
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				callback_query: { data: "conditional" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "initial";

			await flowController.handle(ctx);

			expect(ctx.session.flowState).toBe("nextState");
		});
	});

	describe("executeAction", () => {
		test("should handle command execution and transition to next state", async () => {
			const executeMock = mock(async (input: any) => ({ result: "success" }));
			const mockCommand = createMockCommand(executeMock);
			const mockComponent = createMockComponent({ text: "Next state" });

			const config: FlowConfig = {
				currentState: {
					component: mockComponent,
					onAction: {
						next: {
							command: mockCommand,
							nextState: "nextState",
						} as ActionHandler,
					},
				} as FlowState,
				nextState: {
					component: mockComponent,
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				callback_query: { data: "next" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "currentState";

			// Call executeAction directly through handle which triggers it
			await flowController.handle(ctx);

			expect(executeMock).toHaveBeenCalledWith({ text: undefined }, ctx);
			expect(ctx.session.flowState).toBe("nextState");
		});

		test("should display error message when command execution fails", async () => {
			const mockCommand = createMockCommand(async (input: any) => {
				throw new Error("Command failed");
			});
			const mockComponent = createMockComponent({ text: "Error state" });

			const config: FlowConfig = {
				currentState: {
					component: mockComponent,
					onAction: {
						error: {
							command: mockCommand,
							nextState: "nextState",
						} as ActionHandler,
					},
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				callback_query: { data: "error" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "currentState";

			await flowController.handle(ctx);

			expect(ctx.reply).toHaveBeenCalledWith(
				"Произошла ошибка. Попробуйте еще раз.",
			);
		});
	});

	describe("state rendering via handle()", () => {
		test("should render a state with onEnter query", async () => {
			const executeMock = mock(async (input: any) => ({ count: 42 }));
			const mockQuery = createMockQuery(executeMock);
			const mockComponent = createMockComponent({ text: "State with data" });

			const config: FlowConfig = {
				dataState: {
					component: mockComponent,
					onEnter: mockQuery,
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			// Using a non-matching text to ensure no action is triggered, only rendering
			const ctx = createMockContext({
				message: { text: "some other text" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "dataState";

			await flowController.handle(ctx);

			expect(executeMock).toHaveBeenCalledWith(undefined, ctx);
			expect(mockComponent).toHaveBeenCalledWith({ count: 42 });
			expect(ctx.reply).toHaveBeenCalledWith("State with data", {
				reply_markup: undefined,
			});
		});

		test("should render a state without onEnter query", async () => {
			const mockComponent = createMockComponent({ text: "Simple state" });

			const config: FlowConfig = {
				simpleState: {
					component: mockComponent,
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				message: { text: "some other text" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "simpleState";

			await flowController.handle(ctx);

			expect(mockComponent).toHaveBeenCalledWith({});
			expect(ctx.reply).toHaveBeenCalledWith("Simple state", {
				reply_markup: undefined,
			});
		});

		test("should edit message when rendering is triggered by a callback query", async () => {
			const mockComponent = createMockComponent({ text: "Updated message" });

			const config: FlowConfig = {
				callbackState: {
					component: mockComponent,
					// No onAction so that handle() falls through to rendering
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				callback_query: { data: "non-matching-action" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "callbackState";

			await flowController.handle(ctx);

			expect(ctx.answerCallbackQuery).toHaveBeenCalled();
			expect(ctx.editMessageText).toHaveBeenCalledWith("Updated message", {
				reply_markup: undefined,
			});
		});

		test("should display error message when onEnter query execution fails", async () => {
			const mockQuery = createMockQuery(async (input: any) => {
				throw new Error("Query failed");
			});
			const mockComponent = createMockComponent({ text: "Failing state" });

			const config: FlowConfig = {
				failingState: {
					component: mockComponent,
					onEnter: mockQuery,
				} as FlowState,
			};

			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext({
				message: { text: "some other text" } as any,
			});
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "failingState";

			await flowController.handle(ctx);

			expect(ctx.reply).toHaveBeenCalledWith(
				"Произошла ошибка при отображении экрана.",
			);
		});
	});

	describe("exitFlow", () => {
		test("should remove flowName and flowState from session", () => {
			const config: FlowConfig = {};
			const flowController = new FlowController(config, "testFlow");
			const ctx = createMockContext();
			ctx.session.flowName = "testFlow";
			ctx.session.flowState = "currentState";

			(flowController as any).exitFlow(ctx);

			expect(ctx.session.flowName).toBeUndefined();
			expect(ctx.session.flowState).toBeUndefined();
		});
	});

	describe("complex scenarios", () => {
		test("should handle a multi-step flow with data persistence", async () => {
			// Simulate a flow that collects user data across multiple steps
			const nameQueryExecute = mock(async (input: any) => ({
				name: "John",
				count: 0,
			}));
			const nameQuery = createMockQuery(nameQueryExecute);
			const setNameCommandExecute = mock(async (input: any) => ({
				name: input.name,
				count: 0,
			}));
			const setNameCommand = createMockCommand(setNameCommandExecute);
			const incrementCommandExecute = mock(async (input: any) => ({
				name: input.text,
				count: 1,
			}));
			const incrementCommand = createMockCommand(incrementCommandExecute);
			const finishCommandExecute = mock(async (input: any) => ({
				name: "John",
				count: 1,
			}));
			const finishCommand = createMockCommand(finishCommandExecute);

			const nameComponent = createMockComponent({ text: "What's your name?" });
			const counterComponent = createMockComponent({ text: "Count is 1" });
			const finishComponent = createMockComponent({ text: "Finished!" });

			const config: FlowConfig = {
				getName: {
					component: nameComponent,
					onEnter: nameQuery,
					onText: {
						":name": {
							command: setNameCommand,
							nextState: "incrementCounter",
						} as ActionHandler,
					},
				} as FlowState,
				incrementCounter: {
					component: counterComponent,
					onAction: {
						increment: {
							command: incrementCommand,
							nextState: "finish",
						} as ActionHandler,
					},
				} as FlowState,
				finish: {
					component: finishComponent,
					onAction: {
						done: {
							command: finishCommand,
							nextState: undefined, // Should exit flow
						} as ActionHandler,
					},
				} as FlowState,
			};

			const flowController = new FlowController(config, "multiStepFlow");

			// Step 1: Enter name
			const ctx1 = createMockContext({ message: { text: "John" } as any });
			ctx1.session.flowName = "multiStepFlow";
			ctx1.session.flowState = "getName";

			await flowController.handle(ctx1);

			expect(ctx1.session.flowState).toBe("incrementCounter");
			expect(setNameCommandExecute).toHaveBeenCalledWith(
				{ name: "John", text: "John" },
				ctx1,
			);

			// Step 2: Increment counter via callback
			const ctx2 = createMockContext({
				callback_query: { data: "increment" } as any,
			});
			ctx2.session.flowName = "multiStepFlow";
			ctx2.session.flowState = "incrementCounter";

			await flowController.handle(ctx2);

			expect(ctx2.session.flowState).toBe("finish");
			expect(incrementCommandExecute).toHaveBeenCalledWith(
				{ text: undefined },
				ctx2,
			);

			// Step 3: Finish flow
			const ctx3 = createMockContext({
				callback_query: { data: "done" } as any,
			});
			ctx3.session.flowName = "multiStepFlow";
			ctx3.session.flowState = "finish";

			await flowController.handle(ctx3);

			expect(ctx3.session.flowName).toBeUndefined(); // Flow should be exited
		});

		test("should handle errors gracefully in multi-step flow without losing progress", async () => {
			const failingCommandExecute = mock(async (input: any) => {
				throw new Error("Command failed");
			});
			const failingCommand = createMockCommand(failingCommandExecute);
			const workingCommandExecute = mock(async (input: any) => ({
				result: "success",
			}));
			const workingCommand = createMockCommand(workingCommandExecute);
			const nameComponent = createMockComponent({ text: "What's your name?" });
			const errorComponent = createMockComponent({ text: "Error occurred" });

			const config: FlowConfig = {
				start: {
					component: nameComponent,
					onText: {
						":name": {
							command: failingCommand,
							nextState: "next",
						} as ActionHandler,
					},
				} as FlowState,
				next: {
					component: errorComponent,
					onAction: {
						retry: {
							command: workingCommand,
							nextState: "final",
						} as ActionHandler,
					},
				} as FlowState,
				final: {
					component: errorComponent,
				} as FlowState,
			};

			const flowController = new FlowController(config, "errorFlow");

			// The first step should fail but not crash the flow
			const ctx = createMockContext({ message: { text: "testName" } as any });
			ctx.session.flowName = "errorFlow";
			ctx.session.flowState = "start";

			await flowController.handle(ctx);

			// Should remain in the same state after error
			expect(ctx.session.flowState).toBe("start");
			expect(ctx.reply).toHaveBeenCalledWith(
				"Произошла ошибка. Попробуйте еще раз.",
			);
		});

		test("should handle session data persistence between states", async () => {
			// Test that session data is maintained across state transitions
			const mockCommandExecute = mock(async (input: any) => ({
				name: input.text,
			}));
			const mockCommand = createMockCommand(mockCommandExecute);
			const mockComponent = createMockComponent({ text: "Result" });

			const config: FlowConfig = {
				step1: {
					component: mockComponent,
					onText: {
						":value": {
							command: mockCommand,
							nextState: "step2",
						} as ActionHandler,
					},
				} as FlowState,
				step2: {
					component: mockComponent,
					onEnter: createMockQuery(async (input: any) => ({
						fromStep1: "value",
					})),
				} as FlowState,
			};

			const flowController = new FlowController(config, "sessionFlow");
			const ctx = createMockContext({ message: { text: "testValue" } as any });
			ctx.session.flowName = "sessionFlow";
			ctx.session.flowState = "step1";
			// Add some session data manually
			ctx.session.customData = "preserved";

			await flowController.handle(ctx);

			// Verify we transitioned to next state
			expect(ctx.session.flowState).toBe("step2");
			// Verify session data is preserved
			expect(ctx.session.customData).toBe("preserved");
		});
	});
});

describe("Flow: Terminating Actions", () => {
	test("should fail validation if terminating command expects void input", async () => {
		const terminatingCommand = createRealCommand({
			name: "terminatingVoid",
			input: z.void(),
			output: z.void(),
			execute: mock(async () => {}),
		});

		const config: FlowConfig = {
			initial: {
				component: createMockComponent({ text: "Initial" }),
				onAction: {
					exit: {
						command: terminatingCommand,
					},
				},
			} as FlowState,
		};

		const flowController = new FlowController(config, "testFlow");
		const ctx = createMockContext({
			callback_query: { data: "exit" } as any,
		});
		ctx.session.flowName = "testFlow";
		ctx.session.flowState = "initial";

		await flowController.handle(ctx);

		// The framework passes an empty object `{}` as input, which fails z.void() validation.
		// The user-facing error message is called.
		expect(ctx.reply).toHaveBeenCalledWith(
			"Произошла ошибка. Попробуйте еще раз.",
		);
		// The flow should NOT exit because the action failed before it could complete.
		expect(ctx.session.flowName).toBe("testFlow");
	});

	test("should succeed if terminating command expects an empty object input", async () => {
		const executeMock = mock(async () => {});
		const terminatingCommand = createRealCommand({
			name: "terminatingObject",
			input: z.object({}),
			output: z.void(),
			execute: executeMock,
		});

		const config: FlowConfig = {
			initial: {
				component: createMockComponent({ text: "Initial" }),
				onAction: {
					exit: {
						command: terminatingCommand,
					},
				},
			} as FlowState,
		};

		const flowController = new FlowController(config, "testFlow");
		const ctx = createMockContext({
			callback_query: { data: "exit" } as any,
		});
		ctx.session.flowName = "testFlow";
		ctx.session.flowState = "initial";

		await flowController.handle(ctx);

		// The command should be executed successfully
		expect(executeMock).toHaveBeenCalled();
		// The flow should exit
		expect(ctx.session.flowName).toBeUndefined();
		expect(ctx.session.flowState).toBeUndefined();
	});
});

describe("createFlow", () => {
	test("should create a flow definition with correct name, config, and states mapping", () => {
		const config = {
			initial: {} as FlowState,
			step2: {} as FlowState,
			final: {} as FlowState,
		};

		const flowDef = createFlow("testFlow", config);

		expect(flowDef.name).toBe("testFlow");
		expect(flowDef.config).toBe(config);
		expect(flowDef.states).toEqual({
			initial: "initial",
			step2: "step2",
			final: "final",
		});
	});

	test("should work with single state flow", () => {
		const config = {
			single: {} as FlowState,
		};

		const flowDef = createFlow("singleFlow", config);

		expect(flowDef.name).toBe("singleFlow");
		expect(flowDef.states).toEqual({
			single: "single",
		});
	});
});
