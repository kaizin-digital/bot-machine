import { symbolTools, type SymbolTools } from "./text.extensions";

// A simple class to hold the result of the message builder.
export class FormattedText {
	constructor(
		public readonly text: string,
		public readonly parseMode: "HTML" | undefined,
	) {}
}

type Fragment = string | number | null | undefined | FormattedText | Fragment[];

interface Tool {
	(content: Fragment): FormattedText;
}

// The main Tools interface now includes the formatting tools and the symbol tools.
interface Tools extends SymbolTools {
	b: Tool; // bold
	i: Tool; // italic
	u: Tool; // underline
	s: Tool; // strikethrough
	sp: Tool; // spoiler
	c: Tool; // inline code
	l: (text: Fragment, url: string) => FormattedText; // link
	n: (count?: number) => FormattedText; // newline
	p: Tool; // plain text (escaped)
}

function process(fragment: Fragment, state: { needsHtml: boolean }): string {
	if (fragment === null || fragment === undefined) {
		return "";
	}
	if (Array.isArray(fragment)) {
		return fragment.map((f) => process(f, state)).join("");
	}
	if (fragment instanceof FormattedText) {
		if (fragment.parseMode === "HTML") {
			state.needsHtml = true;
		}
		return fragment.text;
	}
	// For symbols and plain strings/numbers, we just convert to string.
	// The HTML-unsafe characters will be escaped later if needed.
	const text = String(fragment);

	// If the text is a symbol from our tools, it doesn't need escaping.
	// Otherwise, escape plain user-provided strings.
	if (Object.values(symbolTools).includes(text)) {
		return text;
	}

	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

const tools: Tools = {
	// Merge the symbol tools with the formatting tools.
	...symbolTools,
	p: (content) => {
		const state = { needsHtml: false };
		const text = process(content, state);
		return new FormattedText(text, state.needsHtml ? "HTML" : undefined);
	},
	b: (content) => {
		const state = { needsHtml: true };
		const text = process(content, state);
		return new FormattedText(`<b>${text}</b>`, "HTML");
	},
	i: (content) => {
		const state = { needsHtml: true };
		const text = process(content, state);
		return new FormattedText(`<i>${text}</i>`, "HTML");
	},
	u: (content) => {
		const state = { needsHtml: true };
		const text = process(content, state);
		return new FormattedText(`<u>${text}</u>`, "HTML");
	},
	s: (content) => {
		const state = { needsHtml: true };
		const text = process(content, state);
		return new FormattedText(`<s>${text}</s>`, "HTML");
	},
	sp: (content) => {
		const state = { needsHtml: true };
		const text = process(content, state);
		return new FormattedText(`<tg-spoiler>${text}</tg-spoiler>`, "HTML");
	},
	c: (content) => {
		const state = { needsHtml: true };
		const text = process(content, state);
		return new FormattedText(`<code>${text}</code>`, "HTML");
	},
	l: (text, url) => {
		const state = { needsHtml: true };
		const processedText = process(text, state);
		// URLs in attributes must be escaped for quotes
		const escapedUrl = url.replace(/"/g, "&quot;");
		return new FormattedText(
			`<a href="${escapedUrl}">${processedText}</a>`,
			"HTML",
		);
	},
	n: (count = 1) => {
		return new FormattedText("\n".repeat(count), undefined);
	},
};

/**
 * Builds a formatted message using a functional, component-like approach.
 * @param builderFn A function that receives formatting tools and returns a tree of message fragments.
 */
export function format(builderFn: (tools: Tools) => Fragment): FormattedText {
	const fragment = builderFn(tools);
	const state = { needsHtml: false };
	const text = process(fragment, state);
	return new FormattedText(text, state.needsHtml ? "HTML" : undefined);
}
