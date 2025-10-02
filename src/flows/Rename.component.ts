
import { z } from 'zod';
import { Keyboard } from "../keyboard";
import { format } from "../text";
import { getCounterQuery } from '../core/counter';

// The component's props are inferred from the query that fetches its data.
// This makes the component robust to changes in the core data schema.
type Props = z.infer<typeof getCounterQuery.output>;

export async function RenameComponent(props: Props) {
  const keyboard = new Keyboard()
    .text('⬅️ Назад', 'back');

  const msg = format(({ b, n }) => [
    "Текущее имя: ", b(props.name),
    n(2),
    "Введите новое имя:"
  ]);

  return {
    ...msg,
    reply_markup: keyboard.inline(),
  };
}
