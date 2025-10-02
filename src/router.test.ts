import { describe, test, expect, beforeEach, mock } from "bun:test";
import { Router } from "./router";
import type { AppContext, Handler, Middleware, Update } from "./types";
import { FlowController } from "./flow";
import type { TelegramClient } from "@bot-machine/telegram-client";

// Mock context creation helper
const createMockContext = (update: Partial<Update> = {}): AppContext => {
  return {
    update: update as Update,
    client: {} as TelegramClient,
    router: {} as Router,
    from: update.message?.from,
    chat: update.message?.chat,
    session: {},
    state: {},
    params: {},
    reply: mock(async () => ({} as any)),
    editMessageText: mock(async () => ({} as any)),
    deleteMessage: mock(async () => true),
    answerCallbackQuery: mock(async () => true),
    enterFlow: mock(async () => {}),
  } as AppContext;
};

// Mock flow controller helper
const createMockFlowController = (
  name: string,
  handlerResult: boolean = false
): FlowController => {
  return {
    name,
    handle: mock(async () => handlerResult),
  } as FlowController;
};

describe("Router", () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  describe("onCommand", () => {
    test("should register a command handler", async () => {
      const handler = mock(async (ctx: AppContext) => {});
      router.onCommand("test", handler);

      const ctx = createMockContext({
        message: {
          text: "/test",
        } as any,
      });

      await router.route(ctx);

      expect(handler).toHaveBeenCalled();
    });

    test("should match commands with bot username", async () => {
      const handler = mock(async (ctx: AppContext) => {});
      router.onCommand("test", handler);

      const ctx = createMockContext({
        message: {
          text: "/test@botname",
        } as any,
      });

      await router.route(ctx);

      expect(handler).toHaveBeenCalled();
    });

    test("should match commands with arguments", async () => {
      const handler = mock(async (ctx: AppContext) => {});
      router.onCommand("test", handler);

      const ctx = createMockContext({
        message: {
          text: "/test arg1 arg2",
        } as any,
      });

      await router.route(ctx);

      expect(handler).toHaveBeenCalled();
    });

    test("should not match non-command messages", async () => {
      const handler = mock(async (ctx: AppContext) => {});
      router.onCommand("test", handler);

      const ctx = createMockContext({
        message: {
          text: "just text",
        } as any,
      });

      await router.route(ctx);

      expect(handler).not.toHaveBeenCalled();
    });

    test("should match commands with RegExp pattern", async () => {
      const handler = mock(async (ctx: AppContext) => {});
      router.onCommand(/^\/test.*/, handler);

      const ctx = createMockContext({
        message: {
          text: "/test something",
        } as any,
      });

      await router.route(ctx);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("onCallbackQuery", () => {
    test("should register a callback query handler", async () => {
      const handler = mock(async (ctx: AppContext) => {});
      router.onCallbackQuery("action:::id", handler);

      const ctx = createMockContext({
        callback_query: {
          data: "action::123",
        } as any,
      });

      await router.route(ctx);

      expect(handler).toHaveBeenCalled();
    });

    test("should match callback queries with pattern parameters", async () => {
      const handler = mock(async (ctx: AppContext) => {
        expect(ctx.params).toEqual({ action: "increment", id: "456" });
      });
      router.onCallbackQuery(":action:::id", handler);

      const ctx = createMockContext({
        callback_query: {
          data: "increment::456",
        } as any,
      });

      await router.route(ctx);

      expect(handler).toHaveBeenCalled();
    });

    test("should match callback queries with RegExp pattern", async () => {
      const handler = mock(async (ctx: AppContext) => {});
      router.onCallbackQuery(/action::\d+/, handler);

      const ctx = createMockContext({
        callback_query: {
          data: "action::123",
        } as any,
      });

      await router.route(ctx);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("onText", () => {
    test("should register a text handler", async () => {
      const handler = mock(async (ctx: AppContext) => {});
      router.onText("hello", handler);

      const ctx = createMockContext({
        message: {
          text: "hello",
        } as any,
      });

      await router.route(ctx);

      expect(handler).toHaveBeenCalled();
    });

    test("should match text with pattern parameters", async () => {
      const handler = mock(async (ctx: AppContext) => {
        expect(ctx.params).toEqual({ name: "world" });
      });
      router.onText("hello :name", handler);

      const ctx = createMockContext({
        message: {
          text: "hello world",
        } as any,
      });

      await router.route(ctx);

      expect(handler).toHaveBeenCalled();
    });

    test("should match text with RegExp pattern", async () => {
      const handler = mock(async (ctx: AppContext) => {});
      router.onText(/^hello.*/, handler);

      const ctx = createMockContext({
        message: {
          text: "hello there",
        } as any,
      });

      await router.route(ctx);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("addFlow", () => {
    test("should register a flow controller", () => {
      const flowController = createMockFlowController("testFlow");
      router.addFlow(flowController);

      expect((router as any).flows).toEqual({
        testFlow: flowController,
      });
    });
  });

  describe("route", () => {
    test("should delegate to flow controller if user is in a flow", async () => {
      const flowController = createMockFlowController("testFlow", true);
      router.addFlow(flowController);
      
      const textHandler = mock(async (ctx: AppContext) => {});
      router.onText("hello", textHandler);

      const ctx = createMockContext({
        message: { text: "hello" } as any,
      });
      ctx.session.flowName = "testFlow";

      await router.route(ctx);

      expect(flowController.handle).toHaveBeenCalled();
      expect(textHandler).not.toHaveBeenCalled();
    });

    test("should handle stateless commands when not in flow", async () => {
      const flowController = createMockFlowController("testFlow", true);
      router.addFlow(flowController);
      
      const cmdHandler = mock(async (ctx: AppContext) => {});
      router.onCommand("start", cmdHandler);

      const ctx = createMockContext({
        message: { text: "/start" } as any,
      });
      // No flow in session

      await router.route(ctx);

      expect(flowController.handle).not.toHaveBeenCalled();
      expect(cmdHandler).toHaveBeenCalled();
    });

    test("should handle text patterns when not in flow", async () => {
      const flowController = createMockFlowController("testFlow", true);
      router.addFlow(flowController);
      
      const textHandler = mock(async (ctx: AppContext) => {});
      router.onText("hello", textHandler);

      const ctx = createMockContext({
        message: { text: "hello" } as any,
      });
      // No flow in session

      await router.route(ctx);

      expect(flowController.handle).not.toHaveBeenCalled();
      expect(textHandler).toHaveBeenCalled();
    });

    test("should handle callback queries when not in flow", async () => {
      const flowController = createMockFlowController("testFlow", true);
      router.addFlow(flowController);
      
      const callbackHandler = mock(async (ctx: AppContext) => {});
      router.onCallbackQuery("action", callbackHandler);

      const ctx = createMockContext({
        callback_query: { data: "action" } as any,
      });
      // No flow in session

      await router.route(ctx);

      expect(flowController.handle).not.toHaveBeenCalled();
      expect(callbackHandler).toHaveBeenCalled();
    });

    test("should not handle stateless routes if flow handled the update", async () => {
      const flowController = createMockFlowController("testFlow", true);
      router.addFlow(flowController);
      
      const cmdHandler = mock(async (ctx: AppContext) => {});
      router.onCommand("start", cmdHandler);

      const ctx = createMockContext({
        message: { text: "/start" } as any,
      });
      ctx.session.flowName = "testFlow";

      await router.route(ctx);

      expect(flowController.handle).toHaveBeenCalled();
      expect(cmdHandler).not.toHaveBeenCalled();
    });

    test("should handle stateless route if flow did not handle the update", async () => {
      const flowController = createMockFlowController("testFlow", false);
      router.addFlow(flowController);
      
      const cmdHandler = mock(async (ctx: AppContext) => {});
      router.onCommand("start", cmdHandler);

      const ctx = createMockContext({
        message: { text: "/start" } as any,
      });
      ctx.session.flowName = "testFlow";

      await router.route(ctx);

      expect(flowController.handle).toHaveBeenCalled();
      expect(cmdHandler).toHaveBeenCalled();
    });
  });

  describe("use (middleware)", () => {
    test("should register middleware", () => {
      const middleware = mock(async (ctx: AppContext, next: () => Promise<void>) => {
        await next();
      });
      router.use(middleware);

      expect((router as any).middlewares).toEqual([middleware]);
    });

    test("should execute middleware in the order they were added", async () => {
      const executionOrder: string[] = [];
      
      const middleware1 = mock(async (ctx: AppContext, next: () => Promise<void>) => {
        executionOrder.push("middleware1-start");
        await next();
        executionOrder.push("middleware1-end");
      });
      
      const middleware2 = mock(async (ctx: AppContext, next: () => Promise<void>) => {
        executionOrder.push("middleware2-start");
        await next();
        executionOrder.push("middleware2-end");
      });

      router.use(middleware1);
      router.use(middleware2);

      const routeHandler = mock(async (ctx: AppContext) => {
        executionOrder.push("route-handler");
      });
      router.onText("test", routeHandler);

      const client = {} as TelegramClient;

      await router.handle(createMockContext({
        message: { text: "test" } as any,
      }).update, client);

      expect(executionOrder).toEqual([
        "middleware1-start",
        "middleware2-start",
        "route-handler",
        "middleware2-end",
        "middleware1-end",
      ]);
    });
  });

  describe("handle", () => {
    test("should run middleware and route updates", async () => {
      const middleware = mock(async (ctx: AppContext, next: () => Promise<void>) => {
        ctx.state.middlewareRan = true;
        await next();
      });
      router.use(middleware);

      const cmdHandler = mock(async (ctx: AppContext) => {
        expect(ctx.state.middlewareRan).toBe(true);
      });
      router.onCommand("test", cmdHandler);

      const ctx = createMockContext({
        message: { text: "/test" } as any,
      });
      const client = {} as TelegramClient;

      await router.handle(ctx.update, client);

      expect(cmdHandler).toHaveBeenCalled();
    });

    test("should handle errors gracefully", async () => {
      // Mock console.error to capture error messages
      const originalConsoleError = console.error;
      const consoleErrorMock = mock(() => {});
      console.error = consoleErrorMock;

      const errorMiddleware = mock(async (ctx: AppContext, next: () => Promise<void>) => {
        throw new Error("Test error");
      });
      router.use(errorMiddleware);

      const ctx = createMockContext({
        message: { text: "/test" } as any,
      });
      const client = {} as TelegramClient;

      await router.handle(ctx.update, client);

      expect(consoleErrorMock).toHaveBeenCalled();

      // Restore original console.error
      console.error = originalConsoleError;
    });
  });
});