
import type { z, ZodType } from "zod";
import type { AppContext, BotCommand, BotQuery } from "./types";

/**
 * A factory function for creating a `BotQuery` with proper type inference.
 * @param config The query configuration, including input/output schemas and the execute function.
 * @returns The query configuration object, strongly typed.
 */
export function createQuery<TInput extends ZodType, TOutput extends ZodType>(config: {
  input: TInput;
  output: TOutput;
  execute: (input: z.infer<TInput>, ctx: AppContext) => Promise<z.infer<TOutput>>;
}): BotQuery<TInput, TOutput> {
  return { ...config, _id: 'BotQuery' };
}

/**
 * A factory function for creating a `BotCommand` with proper type inference.
 * @param config The command configuration, including input/output schemas and the execute function.
 * @returns The command configuration object, strongly typed.
 */
export function createCommand<TInput extends ZodType, TOutput extends ZodType>(config: {
  input: TInput;
  output: TOutput;
  execute: (input: z.infer<TInput>, ctx: AppContext) => Promise<z.infer<TOutput>>;
}): BotCommand<TInput, TOutput> {
  return { ...config, _id: 'BotCommand' };
}
