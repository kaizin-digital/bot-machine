import { z } from "zod";
import { format, Keyboard, type MessagePayload } from "../../../src";
import { processVpnOrderCommand } from "../logic/vpn";

// The props for this component are inferred from the output of the command that led to this state.
type Props = z.infer<typeof processVpnOrderCommand.output>;

export const CompleteComponent = async (
	props: Props,
): Promise<MessagePayload> => {
	const text = format(({ b, n, c }) => [
		b("✅ Payment Successful!"),
		n(2),
		"Your VPN configuration file is ready.",
		n(2),
		b("File Name:"),
		c(props.fileName),
		n(2),
		b("File Content:"),
		c(props.fileContent),
	]);

	const keyboard = new Keyboard().text("Start Over", "start_over");

	return {
		...text,
		reply_markup: keyboard.inline(),
	};
};
