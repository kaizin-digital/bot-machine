import { describe, test, expect } from "bun:test";
import { z } from "zod";
import { createCommand, createQuery } from "../src/core";

describe("createCommand with optional input schemas", () => {
  test("should handle z.void() schema", async () => {
    const command = createCommand({
      name: "testVoid",
      input: z.void(),
      output: z.string(),
      execute: async (input, ctx) => {
        expect(input).toBeUndefined();
        return "result";
      },
    });

    const result = await command.execute(undefined, {
      logger: console,
      update: {},
      client: {},
      router: {},
      from: undefined,
      chat: undefined,
      session: {},
      state: {},
      params: {},
      reply: async () => ({} as any),
      editMessageText: async () => ({} as any),
      deleteMessage: async () => false,
      answerCallbackQuery: async () => false,
      enterFlow: async () => {},
    });

    expect(result).toBe("result");
  });

  test("should handle z.undefined() schema", async () => {
    const command = createCommand({
      name: "testUndefined",
      input: z.undefined(),
      output: z.string(),
      execute: async (input, ctx) => {
        expect(input).toBeUndefined();
        return "result";
      },
    });

    const result = await command.execute(undefined, {
      logger: console,
      update: {},
      client: {},
      router: {},
      from: undefined,
      chat: undefined,
      session: {},
      state: {},
      params: {},
      reply: async () => ({} as any),
      editMessageText: async () => ({} as any),
      deleteMessage: async () => false,
      answerCallbackQuery: async () => false,
      enterFlow: async () => {},
    });

    expect(result).toBe("result");
  });

  test("should handle empty object schema", async () => {
    const command = createCommand({
      name: "testEmptyObject",
      input: z.object({}),
      output: z.string(),
      execute: async (input, ctx) => {
        expect(input).toEqual({});
        return "result";
      },
    });

    const result = await command.execute({}, {
      logger: console,
      update: {},
      client: {},
      router: {},
      from: undefined,
      chat: undefined,
      session: {},
      state: {},
      params: {},
      reply: async () => ({} as any),
      editMessageText: async () => ({} as any),
      deleteMessage: async () => false,
      answerCallbackQuery: async () => false,
      enterFlow: async () => {},
    });

    expect(result).toBe("result");
  });

  test("should handle normal schema with required fields", async () => {
    const command = createCommand({
      name: "testNormal",
      input: z.object({ value: z.string() }),
      output: z.string(),
      execute: async (input, ctx) => {
        expect(input).toEqual({ value: "test" });
        return `received: ${input.value}`;
      },
    });

    const result = await command.execute({ value: "test" }, {
      logger: console,
      update: {},
      client: {},
      router: {},
      from: undefined,
      chat: undefined,
      session: {},
      state: {},
      params: {},
      reply: async () => ({} as any),
      editMessageText: async () => ({} as any),
      deleteMessage: async () => false,
      answerCallbackQuery: async () => false,
      enterFlow: async () => {},
    });

    expect(result).toBe("received: test");
  });

  test("should validate output against schema", async () => {
    const command = createCommand({
      name: "testOutputValidation",
      input: z.void(),
      output: z.object({ count: z.number() }),
      execute: async (input, ctx) => {
        // This should be valid
        return { count: 42 };
      },
    });

    const result = await command.execute(undefined, {
      logger: console,
      update: {},
      client: {},
      router: {},
      from: undefined,
      chat: undefined,
      session: {},
      state: {},
      params: {},
      reply: async () => ({} as any),
      editMessageText: async () => ({} as any),
      deleteMessage: async () => false,
      answerCallbackQuery: async () => false,
      enterFlow: async () => {},
    });

    expect(result).toEqual({ count: 42 });
  });

  test("should fail if output doesn't match schema", async () => {
    const command = createCommand({
      name: "testOutputValidation",
      input: z.void(),
      output: z.object({ count: z.number() }),
      execute: async (input, ctx) => {
        // This should fail validation
        return { count: "not a number" };
      },
    });

    try {
      await command.execute(undefined, {
        logger: console,
        update: {},
        client: {},
        router: {},
        from: undefined,
        chat: undefined,
        session: {},
        state: {},
        params: {},
        reply: async () => ({} as any),
        editMessageText: async () => ({} as any),
        deleteMessage: async () => false,
        answerCallbackQuery: async () => false,
        enterFlow: async () => {},
      });
      expect(false).toBe(true); // This should not be reached
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("createQuery with optional input schemas", () => {
  test("should handle z.void() schema", async () => {
    const query = createQuery({
      name: "testVoid",
      input: z.void(),
      output: z.string(),
      execute: async (input, ctx) => {
        expect(input).toBeUndefined();
        return "result";
      },
    });

    const result = await query.execute(undefined, {
      logger: console,
      update: {},
      client: {},
      router: {},
      from: undefined,
      chat: undefined,
      session: {},
      state: {},
      params: {},
      reply: async () => ({} as any),
      editMessageText: async () => ({} as any),
      deleteMessage: async () => false,
      answerCallbackQuery: async () => false,
      enterFlow: async () => {},
    });

    expect(result).toBe("result");
  });

  test("should handle empty object schema", async () => {
    const query = createQuery({
      name: "testEmptyObject",
      input: z.object({}),
      output: z.string(),
      execute: async (input, ctx) => {
        expect(input).toEqual({});
        return "result";
      },
    });

    const result = await query.execute({}, {
      logger: console,
      update: {},
      client: {},
      router: {},
      from: undefined,
      chat: undefined,
      session: {},
      state: {},
      params: {},
      reply: async () => ({} as any),
      editMessageText: async () => ({} as any),
      deleteMessage: async () => false,
      answerCallbackQuery: async () => false,
      enterFlow: async () => {},
    });

    expect(result).toBe("result");
  });
});