import { z } from "zod";
import { format, Keyboard, type MessagePayload } from "../../../src";
import { getVpnPlansQuery } from "../logic/vpn";

// The props for this component are inferred from the output of the onEnter query.
type Props = z.infer<typeof getVpnPlansQuery.output>;

export const SelectPlanComponent = async (
	props: Props,
): Promise<MessagePayload> => {
	const text = format(({ b, n, c }) => [
		b("Please select a VPN plan:"),
		n(2),
		...props.map((plan) => [`• ${plan.name} - `, c(`$${plan.price}`), n()]),
	]);

	const keyboard = new Keyboard();
	props.forEach((plan) => {
		// The callback_data `select_plan::planId` will be handled by the Flow's onAction handler.
		keyboard.text(plan.name, `select_plan:${plan.id}`);
	});

	return {
		...text,
		reply_markup: keyboard.inline(),
	};
};
