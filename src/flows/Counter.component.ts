
import { z } from 'zod';
import { Keyboard } from "../keyboard";
import { format } from "../text";
import { getCounterQuery } from '../core/counter';

// The component's props are inferred directly from the query's output schema.
// This ensures the UI is always in sync with the data contract.
type Props = z.infer<typeof getCounterQuery.output>;

export async function CounterComponent(props: Props) {
  const keyboard = new Keyboard()
    .text('➖', 'decrement')
    .text('➕', 'increment')
    .row()
    .text('✏️ Переименовать', 'rename');

  const msg = format(({ b }) => [
    b(props.name), ": ", b(String(props.count))
  ]);

  return {
    ...msg,
    reply_markup: keyboard.inline(),
  };
}
