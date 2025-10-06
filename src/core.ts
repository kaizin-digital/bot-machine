import type { z, ZodType } from "zod";
import type { AppContext, BotCommand, BotQuery } from "./types";

/**
 * A factory function for creating a `BotQuery` with proper type inference and built-in logging.
 * @param config The query configuration, including a name, input/output schemas, and the execute function.
 * @returns The query configuration object, strongly typed.
 */
export function createQuery<TInput extends ZodType, TOutput extends ZodType>(config: {
  name: string;
  input: TInput;
  output: TOutput;
  execute: (input: z.infer<TInput>, ctx: AppContext) => Promise<z.infer<TOutput>>;
}): BotQuery<TInput, TOutput> {
  const { name, execute, input: inputSchema, output: outputSchema } = config;

  const loggedExecute = async (input: z.infer<TInput> | undefined, ctx: AppContext): Promise<z.infer<TOutput>> => {
    const parsedInput = inputSchema.parse(input);
    ctx.logger.info({ query: name, input: parsedInput }, `[Query] Executing: ${name}`);
    try {
      const result = await execute(parsedInput, ctx);
      const parsedOutput = outputSchema.parse(result);
      ctx.logger.info({ query: name, result: parsedOutput }, `[Query] Success: ${name}`);
      return parsedOutput;
    } catch (error) {
      ctx.logger.error({ query: name, error }, `[Query] Failed: ${name}`);
      throw error;
    }
  };

  return { ...config, execute: loggedExecute, _id: 'BotQuery', name };
};

/**
 * A factory function for creating a `BotCommand` with proper type inference and built-in logging.
 * @param config The command configuration, including a name, input/output schemas, and the execute function.
 * @returns The command configuration object, strongly typed.
 */
export function createCommand<TInput extends ZodType, TOutput extends ZodType>(config: {
  name: string;
  input: TInput;
  output: TOutput;
  execute: (input: z.infer<TInput>, ctx: AppContext) => Promise<z.infer<TOutput>>;
}): BotCommand<TInput, TOutput> {
  const { name, execute, input: inputSchema, output: outputSchema } = config;

  const loggedExecute = async (input: z.infer<TInput> | undefined, ctx: AppContext): Promise<z.infer<TOutput>> => {
    const parsedInput = inputSchema.parse(input);
    ctx.logger.info({ command: name, input: parsedInput }, `[Command] Executing: ${name}`);
    try {
      const result = await execute(parsedInput, ctx);
      const parsedOutput = outputSchema.parse(result);
      ctx.logger.info({ command: name, result: parsedOutput }, `[Command] Success: ${name}`);
      return parsedOutput;
    } catch (error) {
      ctx.logger.error({ command: name, error }, `[Command] Failed: ${name}`);
      throw error;
    }
  };

  return { ...config, execute: loggedExecute, _id: 'BotCommand', name };
}