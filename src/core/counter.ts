import { createCommand, createQuery } from '../core';
import { z } from 'zod';

export const getCounterQuery = createQuery({
  name: "getCounter",
  input: z.object({}),
  output: z.object({
    count: z.number(),
    name: z.string(),
  }),
  execute: async (input: { }, ctx: import("../types").AppContext) => {
    return { count: 0, name: 'default' };
  },
});

export const incrementCounterCommand = createCommand({
  name: "incrementCounter",
  input: z.object({}),
  output: z.object({
    count: z.number(),
  }),
  execute: async (input: { }, ctx: import("../types").AppContext) => {
    return { count: 1 };
  },
});

export const decrementCounterCommand = createCommand({
  name: "decrementCounter",
  input: z.object({}),
  output: z.object({
    count: z.number(),
  }),
  execute: async (input: { }, ctx: import("../types").AppContext) => {
    return { count: -1 };
  },
});

export const renameCounterCommand = createCommand({
  name: "renameCounter",
  input: z.object({
    newName: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
  execute: async (input: { newName: string }, ctx: import("../types").AppContext) => {
    return { success: true };
  },
});