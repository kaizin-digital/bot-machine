import { z } from 'zod';
import { format, Keyboard, MessagePayload } from '../../../src';
import { getVpnPlanQuery } from '../logic/vpn';
import { InfoPanel } from '../../../src/ui-kit';

// The props for this component are inferred from the output of the onEnter query.
type Props = z.infer<typeof getVpnPlanQuery.output>;

export const ConfirmPlanComponent = async (props: Props): Promise<MessagePayload> => {
  const text = format(({ b, n, arrowLeft, check }) => [
    b('Confirm your selection:'),
    n(2),
    InfoPanel({ keyValues: { Plan: props.name, Price: `$${props.price}` } }),
    n(),
    'Proceed to payment?',
  ]);

  const keyboard = new Keyboard()
    .text(`${check} Yes, proceed`, 'confirm_payment')
    .row()
    .text(`${arrowLeft} Go back`, 'go_back');

  return {
    ...text,
    reply_markup: keyboard.inline(),
  };
};
