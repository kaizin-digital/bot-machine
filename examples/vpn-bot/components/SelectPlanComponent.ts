import { z } from 'zod';
import { Keyboard, MessagePayload, format } from '../../../src';
import { getVpnPlansQuery } from '../logic/vpn';
import { BulletedList } from '../../../src/ui-kit';

// The props for this component are inferred from the output of the onEnter query.
type Props = z.infer<typeof getVpnPlansQuery.output>;

export const SelectPlanComponent = async (props: Props): Promise<MessagePayload> => {

  const planItems = props.map((plan) =>
    format(({ c }) => [`${plan.name} - `, c(`$${plan.price}`)])
  );

  const text = format(({ b, n }) => [
    b('Please select a VPN plan:'),
    n(2),
    BulletedList({ items: planItems }),
  ]);

  const keyboard = new Keyboard();
  props.forEach((plan) => {
    keyboard.text(plan.name, `select_plan:${plan.id}`);
  });

  return {
    ...text,
    reply_markup: keyboard.inline(),
  };
};
