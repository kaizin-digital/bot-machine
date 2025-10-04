
import type { AppContext, FlowConfig, ActionHandler, FlowDefinition } from './types';
import { pathStringToRegex } from './utils';

/**
 * Manages the logic for a stateful, multi-step dialogue (a "flow").
 * It acts as a state machine, transitioning between states based on user actions.
 */
export class FlowController {
  /** The unique name of this flow. */
  public readonly name: string;
  private readonly config: FlowConfig;

  /**
   * Creates a new FlowController.
   * @param config The configuration object defining the states and transitions.
   * @param name The unique name for this flow.
   */
  constructor(config: FlowConfig, name: string) {
    this.config = config;
    this.name = name;
  }

  /**
   * Handles an update if the user is currently in this flow.
   * @param ctx The application context.
   * @returns `true` if the update was handled by the flow, `false` otherwise.
   * @internal
   */
  public async handle(ctx: AppContext): Promise<boolean> {
    if (ctx.session.flowName !== this.name) {
      return false;
    }

    const currentStateName = ctx.session.flowState ?? 'index';
    const currentState = this.config[currentStateName];

    if (!currentState) {
      console.error(`State '${currentStateName}' not found in flow '${this.name}'`)
      this.exitFlow(ctx);
      return false;
    }

    const processPatterns = async (text: string, handlers: Record<string, ActionHandler>): Promise<boolean> => {
      for (const pattern in handlers) {
        const regex = pattern.includes(':') ? pathStringToRegex(pattern) : new RegExp(pattern);
        const match = text.match(regex);
        if (match) {
          const action = handlers[pattern];
          // Use groups if available (for named captures in the future), otherwise map positional captures to parameter names
          if (match.groups) {
            ctx.params = match.groups;
          } else {
            // For positional captures from string patterns like ':action:::id',
            // map them to their original parameter names by extracting them from the pattern
            ctx.params = {};
            const paramNames = this.extractParamNames(pattern);
            if (paramNames && match.length > 1) {
              for (let i = 0; i < paramNames.length && i + 1 < match.length; i++) {
                const paramName = paramNames[i];
                if (paramName) {
                  const value = match[i + 1];
                  if (value) {
                    ctx.params[paramName] = value;
                  }
                }
              }
            }
          }
          if (action) {
            await this.executeAction(action, ctx);
          }
          return true;
        }
      }
      return false;
    };

    // Check for a callback query action
    const callbackData = ctx.update.callback_query?.data;
    if (callbackData && currentState.onAction) {
      if (await processPatterns(callbackData, currentState.onAction)) return true;
    }

    // Check for a text message action
    const text = ctx.update.message?.text;
    if (text && currentState.onText) {
      if (await processPatterns(text, currentState.onText)) return true;
    }

    // If no action was triggered, just re-render the current state.
    await this.renderState(currentStateName, ctx);
    return true;
  }

  /** @internal */
  private async executeAction(action: ActionHandler, ctx: AppContext) {
    const { command } = action;

    // The payload for the command is a combination of route params and the message text.
    const rawInput = { ...ctx.params, text: ctx.update.message?.text };

    try {
      const input = command.input.parse(rawInput);
      const result = await command.execute(input, ctx);

      // Optionally, validate output to ensure business logic adheres to its contract.
      command.output.parse(result);

      let nextStateName: string | undefined;
      if (action.refresh) {
        nextStateName = ctx.session.flowState;
      } else if (action.nextState) {
        nextStateName = typeof action.nextState === 'function' ? action.nextState(result) : action.nextState;
      }

      if (nextStateName) {
        ctx.session.flowState = nextStateName;
        await this.renderState(nextStateName, ctx);
      } else {
        this.exitFlow(ctx);
      }
    } catch (error) {
      console.error("Zod validation or command execution error:", error);
      // TODO: Add user-facing error message logic
      await ctx.reply("Произошла ошибка. Попробуйте еще раз.");
    }
  }

  /** @internal */
  private async renderState(stateName: string, ctx: AppContext) {
    const state = this.config[stateName];
    if (!state) {
      console.error(`Cannot render non-existent state '${stateName}' in flow '${this.name}'`);
      this.exitFlow(ctx);
      return;
    }

    try {
      // 1. Get data for the component by running the onEnter query.
      let props = {};
      if (state.onEnter) {
        // For queries, the input is usually void or comes from session, not user input.
        const input = state.onEnter.input.parse(undefined);
        props = await state.onEnter.execute(input, ctx);
        state.onEnter.output.parse(props);
      }

      // 2. Render the component to get the message payload.
      const messagePayload = await state.component(props);

      // 3. Send or edit the message.
      const isUpdateFromCallback = !!ctx.update.callback_query;
      if (isUpdateFromCallback) {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(messagePayload.text, { reply_markup: messagePayload.reply_markup });
      } else {
        await ctx.reply(messagePayload.text, { reply_markup: messagePayload.reply_markup });
      }
    } catch (error) {
      console.error("Zod validation or query execution error in renderState:", error);
      await ctx.reply("Произошла ошибка при отображении экрана.");
    }
  }

  /** @internal */
  private extractParamNames(patternStr: string): string[] {
    const paramNames: string[] = [];
    const regex = /:(\w+)/g;
    let match;
    while ((match = regex.exec(patternStr)) !== null) {
      if (match[1]) {
        paramNames.push(match[1]);
      }
    }
    return paramNames;
  }

  /** @internal */
  private exitFlow(ctx: AppContext) {
    delete ctx.session.flowName;
    delete ctx.session.flowState;
  }
}

/**
 * A factory function for creating a type-safe `FlowDefinition`.
 * @param name The unique name for this flow.
 * @param config The flow configuration object, mapping state names to state definitions.
 * @returns A `FlowDefinition` object with the config and a type-safe `states` map.
 */
export function createFlow<TConfig extends FlowConfig>(
  name: string,
  config: TConfig
): FlowDefinition<TConfig> {
  const states = Object.keys(config).reduce((acc, key) => {
    acc[key as keyof TConfig] = key as keyof TConfig;
    return acc;
  }, {} as { [K in keyof TConfig]: K });

  return {
    name,
    config,
    states,
  };
}
