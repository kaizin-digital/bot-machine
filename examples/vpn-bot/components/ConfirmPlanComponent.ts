import { z } from "zod";
import { format, Keyboard, type MessagePayload } from "../../../src";
import { getVpnPlanQuery } from "../logic/vpn";

// The props for this component are inferred from the output of the onEnter query.
type Props = z.infer<typeof getVpnPlanQuery.output>;

export const ConfirmPlanComponent = async (
	props: Props,
): Promise<MessagePayload> => {
	const text = format(({ b, n, c }) => [
		b("Confirm your selection:"),
		n(2),
		`You have selected `,
		b(props.name),
		` for `,
		c(`$${props.price}`),
		".",
		n(2),
		"Proceed to payment?",
	]);

	const keyboard = new Keyboard()
		.text("✅ Yes, proceed", "confirm_payment")
		.row()
		.text("⬅ Go back", "go_back");

	return {
		...text,
		reply_markup: keyboard.inline(),
	};
};
