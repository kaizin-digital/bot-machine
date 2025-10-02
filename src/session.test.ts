import { describe, test, expect, beforeEach, mock } from "bun:test";
import { session } from "./session";
import type { AppContext, ISessionStore, Middleware } from "./types";

// 1. Create a mock session store
const mockStore: ISessionStore = {
	get: mock(async (key: string) => undefined),
	set: mock(async (key: string, value: Record<string, any>) => {}),
	delete: mock(async (key: string) => {}),
};

// 2. Helper to create a mock context
const createMockContext = (userId: number | undefined): AppContext =>
	({
		from: userId
			? { id: userId, is_bot: false, first_name: "Test" }
			: undefined,
		session: {},
	}) as AppContext;

// 3. Helper to run the middleware
const runMiddleware = async (middleware: Middleware, ctx: AppContext) => {
	const next = mock(() => Promise.resolve());
	await middleware(ctx, next);
	return { next };
};

describe("Session Middleware", () => {
	beforeEach(() => {
		// Reset mocks before each test
		mockStore.get.mockClear();
		mockStore.set.mockClear();
		mockStore.delete.mockClear();
	});

	test("should load an empty session for a new user", async () => {
		const ctx = createMockContext(123);
		const sessionMiddleware = session({ store: mockStore });

		// Simulate no session in store
		(mockStore.get as any).mockResolvedValueOnce(undefined);

		const { next } = await runMiddleware(sessionMiddleware, ctx);

		expect(mockStore.get).toHaveBeenCalledWith("123");
		expect(ctx.session).toEqual({});
		expect(next).toHaveBeenCalled();
		// Since session is empty, delete should not be called, set should not be called
		expect(mockStore.set).not.toHaveBeenCalled();
		expect(mockStore.delete).not.toHaveBeenCalled();
	});

	test("should load an existing session from the store", async () => {
		const ctx = createMockContext(456);
		const sessionMiddleware = session({ store: mockStore });
		const existingSession = { flowName: "main", counterValue: 10 };

		(mockStore.get as any).mockResolvedValueOnce(existingSession);

		await runMiddleware(sessionMiddleware, ctx);

		expect(mockStore.get).toHaveBeenCalledWith("456");
		expect(ctx.session).toEqual(existingSession);
	});

	test("should save the session to the store if modified", async () => {
		const ctx = createMockContext(789);
		const sessionMiddleware = session({ store: mockStore });

		(mockStore.get as any).mockResolvedValueOnce(undefined);

		// Run middleware, and simulate a handler modifying the session
		await sessionMiddleware(ctx, async () => {
			ctx.session.flowName = "main";
		});

		expect(mockStore.set).toHaveBeenCalledWith("789", { flowName: "main" });
		expect(mockStore.delete).not.toHaveBeenCalled();
	});

	test("should delete the session from the store if it becomes empty", async () => {
		const ctx = createMockContext(101);
		const sessionMiddleware = session({ store: mockStore });
		const existingSession = { flowName: "main" };

		(mockStore.get as any).mockResolvedValueOnce(existingSession);

		// Run middleware, and simulate a handler clearing the session
		await sessionMiddleware(ctx, async () => {
			delete ctx.session.flowName;
		});

		expect(mockStore.delete).toHaveBeenCalledWith("101");
		expect(mockStore.set).not.toHaveBeenCalled();
	});

	test("should do nothing if user is not present in context", async () => {
		const ctx = createMockContext(undefined); // No user
		const sessionMiddleware = session({ store: mockStore });

		const { next } = await runMiddleware(sessionMiddleware, ctx);

		expect(ctx.session).toEqual({});
		expect(next).toHaveBeenCalled();
		expect(mockStore.get).not.toHaveBeenCalled();
		expect(mockStore.set).not.toHaveBeenCalled();
		expect(mockStore.delete).not.toHaveBeenCalled();
	});
});
