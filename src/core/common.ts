import { createCommand } from '../core';
import { z } from 'zod';

export const noopCommand = createCommand({
  name: "noop",
  input: z.object({}),
  output: z.object({}),
  execute: async (input: { }, ctx: import("../types").AppContext) => {
    return {};
  },
});