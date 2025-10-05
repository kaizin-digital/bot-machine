import { format, type FormattedText } from "../text";
import { BulletedList, InfoPanel } from "./base.ui-kit";

/**
 * Displays a product with its name, price, and optional description.
 * @param name - The product name.
 * @param price - The product price.
 * @param description - (Optional) A short description.
 */
export function ProductCard({
	name,
	price,
	description,
}: {
	name: string;
	price: number;
	description?: string;
}): FormattedText {
	return format(({ b, i, c, n, money }) => [
		money, " ", b(name), n(),
		b("Price: "), c(`$${price}`), n(),
		description ? [i(description), n()] : null,
	]);
}

/**
 * Displays the contents of a shopping cart.
 * @param items - An array of objects with `name` and `quantity`.
 * @param total - The total price.
 */
export function ShoppingCart({
	items,
	total,
}: {
	items: { name: string; quantity: number }[];
	total: number;
}): FormattedText {
	const itemLines = items.map((item) => `${item.name} (x${item.quantity})`);

	return format(({ b, n, hr }) => [
		b("🛒 Your Cart"),
		hr,
		BulletedList({ items: itemLines }),
		hr,
		b("Total: "), `$${total}`,
	]);
}

/**
 * Displays the status of an order.
 * @param orderId - The ID of the order.
 * @param status - The current status (e.g., "Shipped", "Processing").
 * @param estimatedDelivery - (Optional) The estimated delivery date.
 */
export function OrderStatus({
	orderId,
	status,
	estimatedDelivery,
}: {
	orderId: string;
	status: string;
	estimatedDelivery?: string;
}): FormattedText {
	const details: Record<string, any> = {
		"Order ID": orderId,
		Status: status,
	};
	if (estimatedDelivery) {
		details["Est. Delivery"] = estimatedDelivery;
	}

	return format(({ b, n, rocket }) => [
		rocket, " ", b("Order Status"), n(2),
		InfoPanel({ keyValues: details }),
	]);
}
