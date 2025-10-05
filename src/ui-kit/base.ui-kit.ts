import { format, type FormattedText } from "../text";

/**
 * A generic welcome message.
 * @param title - The main headline.
 * @param subtitle - (Optional) A smaller text below the title.
 */
export function WelcomeMessage({
	title,
	subtitle,
}: { title: string; subtitle?: string }): FormattedText {
	return format(({ b, i, n, party }) => [
		party, " ", b(title), n(2),
		subtitle ? [i(subtitle), n(2)] : null,
	]);
}

/**
 * A generic success message.
 * @param title - The main success headline (e.g., "Payment Successful!").
 * @param details - (Optional) A smaller text with details.
 */
export function SuccessMessage({
	title,
	details,
}: { title: string; details?: string }): FormattedText {
	return format(({ b, i, n, check }) => [
		check, " ", b(title), n(2),
		details ? [i(details), n(2)] : null,
	]);
}

/**
 * A generic error message.
 * @param error - The main error message (e.g., "Payment Failed").
 * @param suggestion - (Optional) A suggestion for the user (e.g., "Please try again later.").
 */
export function ErrorMessage({
	error,
	suggestion,
}: { error: string; suggestion?: string }): FormattedText {
	return format(({ b, i, n, cross }) => [
		cross, " ", b(error), n(2),
		suggestion ? [i(suggestion), n(2)] : null,
	]);
}

/**
 * Displays a list of items with bullets.
 * @param items - An array of strings or FormattedText objects.
 */
export function BulletedList({ items }: { items: any[] }): FormattedText {
	return format(({ bullet, n }) => [
		...items.map((item) => [bullet, " ", item, n()]),
	]);
}

/**
 * Displays key-value data in a structured panel.
 * @param keyValues - An object where keys are labels and values are the data to display.
 */
export function InfoPanel({
	keyValues,
}: { keyValues: Record<string, any> }): FormattedText {
	return format(({ b, c, n }) => [
		...Object.entries(keyValues).map(([key, value]) => [
			b(`${key}: `), c(value), n(),
		]),
	]);
}
