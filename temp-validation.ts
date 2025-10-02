
// This is a temporary file to validate code examples from the documentation.
// It is not meant to be run, only to be type-checked.

import { z } from 'zod';

// Mock classes and functions that are not fully implemented yet
// but are mentioned in the documentation.
const Telegraf = class {};

// Assuming these are the core exports from our framework
import { Router }from './src/router';
import { session } from './src/session';
import { FlowController, createFlow } from './src/flow';
import { createCommand, createQuery } from './src/core';
import { Keyboard } from './src/keyboard';
import { format, FormattedText } from './src/text';
import { TelegramClient } from '@bot-machine/telegram-client';

// =================================================================
// Validation for: TELEGRAM_FRAMEWORK_SPEC.md
// =================================================================

// Mock SotaJS core functions
const getCounterQuery = createQuery({
	input: z.void(),
	output: z.object({ count: z.number() }),
	execute: async () => ({ count: 0 }),
});
const incrementCounterCommand = createCommand({
	input: z.void(),
	output: z.object({ count: z.number() }),
	execute: async () => ({ count: 1 }),
});
const decrementCounterCommand = createCommand({
	input: z.void(),
	output: z.object({ count: z.number() }),
	execute: async () => ({ count: -1 }),
});


// Corrected Counter.component.ts example
async function CounterComponent(props: { count: number }) {
  const kbd = new Keyboard()
    .text('➖', 'decrement')
    .text('➕', 'increment');

  const msg = format(({ b }) => [`Текущее значение: `, b(props.count)]);

  return { ...msg, reply_markup: kbd.inline() };
}


// Corrected main.flow.ts example
const mainFlow = createFlow('main', {
  'counter': {
    component: CounterComponent,
    onEnter: getCounterQuery,
    onAction: {
      'increment': {
        command: incrementCounterCommand,
        refresh: true,
      },
      'decrement': {
        command: decrementCounterCommand,
        refresh: true,
      },
    },
  },
});


// Corrected index.ts example
async function setupBot() {
  if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN missing');
  const client = new TelegramClient(process.env.BOT_TOKEN);
  const router = new Router();

  // Use in-memory session store for the example
  router.use(session());

  const mainFlowController = new FlowController(mainFlow.config, mainFlow.name);
  router.addFlow(mainFlowController);

  router.onCommand('start', (ctx) => ctx.enterFlow(mainFlow.name, mainFlow.states.counter));

  // This would be the polling call in a real app
  // client.startPolling(router);
}


// =================================================================
// Validation for: AI_DRIVEN_WORKFLOW.md
// =================================================================

// Mock pizza example
const PizzaOrderOutput = z.object({
  id: z.string(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  status: z.enum(['pending', 'delivered']),
});
const getOrderQuery = createQuery({
  input: z.object({ id: z.string() }),
  output: PizzaOrderOutput,
  execute: async ({ id }) => ({ id, status: 'pending' }),
});
const updateOrderSizeCommand = createCommand({
    input: z.object({ size: z.string() }),
    output: PizzaOrderOutput,
    execute: async (input) => ({ id: '123', ...input, status: 'pending' })
});

type Props = z.infer<typeof getOrderQuery.output>;

async function SelectSizeComponent(props: Props) {
  const kbd = new Keyboard()
    .text('Small', 'select_size:small')
    .text('Medium', 'select_size:medium')
    .text('Large', 'select_size:large');

  const msg = format(({ i, b }) => [
    b('Order #'), i(props.id), b(': Please select a size'),
  ]);

  return { ...msg, reply_markup: kbd.inline() };
}

const pizzaFlow = createFlow('pizza', {
  'selectSize': {
    component: SelectSizeComponent,
    onEnter: getOrderQuery,
    onAction: {
      'select_size::size': {
        command: updateOrderSizeCommand,
        nextState: 'selectType', // Assuming 'selectType' exists
      }
    }
  },
  'selectType': {
      component: async () => format(({p}) => [p('Select type')]),
  }
});


// =================================================================
// Validation for: KEYBOARD_BUILDER_SPEC.md & TEXT_BUILDER_SPEC.md
// =================================================================

async function usageExample(ctx: BotContext) {
    // Keyboard
    const kbd = new Keyboard().text('Hi', 'hi');
    // The spec says `await ctx.reply(kbd)`, but implementation requires this:
    await ctx.reply('Text', { reply_markup: kbd.inline() });


    // Text
    const msg = format(({b, i}) => [b('Hello, '), i(ctx.from?.first_name ?? 'User')]);
    // The spec says `await ctx.reply(msgObject)`, and the implementation supports this.
    await ctx.reply(msg);
}

