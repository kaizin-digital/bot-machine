import { describe, test, expect } from "bun:test";
import {
	WelcomeMessage,
	SuccessMessage,
	ErrorMessage,
	BulletedList,
	InfoPanel,
} from "./base.ui-kit";

describe("Base UI Kit", () => {
	test("should render a WelcomeMessage", () => {
		const result = WelcomeMessage({
			title: "Welcome to the Bot!",
			subtitle: "Let's get started.",
		});
		expect(result.text).toMatchSnapshot();
	});

	test("should render a WelcomeMessage without a subtitle", () => {
		const result = WelcomeMessage({ title: "Welcome!" });
		expect(result.text).toMatchSnapshot();
	});

	test("should render a SuccessMessage", () => {
		const result = SuccessMessage({
			title: "Order Confirmed",
			details: "Your order #123 has been processed.",
		});
		expect(result.text).toMatchSnapshot();
	});

	test("should render an ErrorMessage", () => {
		const result = ErrorMessage({
			error: "Payment Failed",
			suggestion: "Please check your card details and try again.",
		});
		expect(result.text).toMatchSnapshot();
	});

	test("should render a BulletedList", () => {
		const result = BulletedList({
			items: ["First item", "Second item", "Third item"],
		});
		expect(result.text).toMatchSnapshot();
	});

	test("should render an InfoPanel", () => {
		const result = InfoPanel({
			keyValues: {
				"Order ID": "123-XYZ",
				Status: "Shipped",
				Amount: "$99.99",
			},
		});
		expect(result.text).toMatchSnapshot();
	});
});
