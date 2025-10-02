import { describe, test, expect } from "bun:test";
import { Keyboard } from "./keyboard";
import type {
	InlineKeyboardButton,
	ReplyKeyboardMarkup,
	ReplyKeyboardRemove,
} from "@bot-machine/telegram-client/dist/telegram-types";

describe("Keyboard", () => {
	describe("Basic functionality", () => {
		test("should create an empty keyboard", () => {
			const keyboard = new Keyboard();
			const markup = keyboard.inline();
			expect(markup.inline_keyboard).toEqual([[]]);
		});

		test("should create a new row when row() is called", () => {
			const keyboard = new Keyboard();
			keyboard.row();
			const markup = keyboard.inline();
			expect(markup.inline_keyboard).toEqual([[], []]);
		});
	});

	describe("Inline keyboard buttons", () => {
		test("should add a text button", () => {
			const keyboard = new Keyboard();
			keyboard.text("Button 1", "callback1");
			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([[{
				text: "Button 1",
				callback_data: "callback1"
			}]]);
		});

		test("should add multiple buttons in a row", () => {
			const keyboard = new Keyboard();
			keyboard.text("Button 1", "callback1");
			keyboard.text("Button 2", "callback2");
			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([[
				{
					text: "Button 1",
					callback_data: "callback1"
				},
				{
					text: "Button 2", 
					callback_data: "callback2"
				}
			]]);
		});

		test("should add buttons in different rows", () => {
			const keyboard = new Keyboard();
			keyboard.text("Button 1", "callback1");
			keyboard.row();
			keyboard.text("Button 2", "callback2");
			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([
				[{
					text: "Button 1",
					callback_data: "callback1"
				}],
				[{
					text: "Button 2",
					callback_data: "callback2"
				}]
			]);
		});

		test("should add a URL button", () => {
			const keyboard = new Keyboard();
			keyboard.url("Visit Google", "https://google.com");
			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([[{
				text: "Visit Google",
				url: "https://google.com"
			}]]);
		});

		test("should add a login URL button", () => {
			const keyboard = new Keyboard();
			const loginUrl = {
				url: "https://example.com/login",
				forward_text: "Forward text",
				bot_username: "bot",
				request_write_access: true
			};
			keyboard.login("Login", loginUrl);
			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([[{
				text: "Login",
				login_url: loginUrl
			}]]);
		});

		test("should add a switch inline query button", () => {
			const keyboard = new Keyboard();
			keyboard.switchInline("Switch to inline", "search_query");
			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([[{
				text: "Switch to inline",
				switch_inline_query: "search_query"
			}]]);
		});

		test("should add a switch inline query current chat button", () => {
			const keyboard = new Keyboard();
			keyboard.switchInlineCurrent("Switch current", "current_query");
			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([[{
				text: "Switch current",
				switch_inline_query_current_chat: "current_query"
			}]]);
		});

		test("should add a web app button", () => {
			const keyboard = new Keyboard();
			const webAppInfo = {
				url: "https://example.com/app"
			};
			keyboard.webApp("Open App", webAppInfo);
			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([[{
				text: "Open App",
				web_app: webAppInfo
			}]]);
		});

		test("should add a pay button", () => {
			const keyboard = new Keyboard();
			keyboard.pay("Buy Now");
			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([[{
				text: "Buy Now",
				pay: true
			}]]);
		});
	});

	describe("Reply keyboard buttons", () => {
		test("should add a contact request button", () => {
			const keyboard = new Keyboard();
			keyboard.requestContact("Share Contact");
			const markup = keyboard.reply();
			
			expect(markup.keyboard).toEqual([[{
				text: "Share Contact",
				request_contact: true
			}]]);
		});

		test("should add a location request button", () => {
			const keyboard = new Keyboard();
			keyboard.requestLocation("Share Location");
			const markup = keyboard.reply();
			
			expect(markup.keyboard).toEqual([[{
				text: "Share Location",
				request_location: true
			}]]);
		});

		test("should add a poll request button", () => {
			const keyboard = new Keyboard();
			keyboard.requestPoll("Create Quiz", "quiz");
			const markup = keyboard.reply();
			
			expect(markup.keyboard).toEqual([[{
				text: "Create Quiz",
				request_poll: { type: "quiz" }
			}]]);
		});

		test("should add a regular poll request button", () => {
			const keyboard = new Keyboard();
			keyboard.requestPoll("Create Poll", "regular");
			const markup = keyboard.reply();
			
			expect(markup.keyboard).toEqual([[{
				text: "Create Poll",
				request_poll: { type: "regular" }
			}]]);
		});

		test("should add a poll request button with no type specified", () => {
			const keyboard = new Keyboard();
			keyboard.requestPoll("Create Poll");
			const markup = keyboard.reply();
			
			expect(markup.keyboard).toEqual([[{
				text: "Create Poll",
				request_poll: { type: undefined }
			}]]);
		});
	});

	describe("Reply keyboard output", () => {
		test("should create a reply keyboard with default options", () => {
			const keyboard = new Keyboard();
			keyboard.text("Button 1", "callback1");
			const markup = keyboard.reply();
			
			expect(markup).toEqual({
				keyboard: [[{ text: "Button 1", callback_data: "callback1" }]]
			});
		});

		test("should create a reply keyboard with all options", () => {
			const keyboard = new Keyboard();
			keyboard.text("Button 1", "callback1");
			const markup = keyboard.reply({
				is_persistent: true,
				resize_keyboard: true,
				one_time_keyboard: true,
				input_field_placeholder: "Type here",
				selective: true
			});
			
			expect(markup).toEqual({
				keyboard: [[{ text: "Button 1", callback_data: "callback1" }]],
				is_persistent: true,
				resize_keyboard: true,
				one_time_keyboard: true,
				input_field_placeholder: "Type here",
				selective: true
			});
		});
	});

	describe("Remove keyboard", () => {
		test("should create a keyboard remove object without selective flag", () => {
			const removeKeyboard = Keyboard.remove();
			
			expect(removeKeyboard).toEqual({
				remove_keyboard: true,
				selective: undefined
			});
		});

		test("should create a keyboard remove object with selective flag", () => {
			const removeKeyboard = Keyboard.remove(true);
			
			expect(removeKeyboard).toEqual({
				remove_keyboard: true,
				selective: true
			});
		});
	});

	describe("Method chaining", () => {
		test("row() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const result = keyboard.row();
			
			expect(result).toBe(keyboard);
		});

		test("text() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const result = keyboard.text("Button", "data");
			
			expect(result).toBe(keyboard);
		});

		test("url() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const result = keyboard.url("Button", "url");
			
			expect(result).toBe(keyboard);
		});

		test("login() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const loginUrl = { url: "https://example.com" };
			const result = keyboard.login("Button", loginUrl);
			
			expect(result).toBe(keyboard);
		});

		test("switchInline() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const result = keyboard.switchInline("Button", "query");
			
			expect(result).toBe(keyboard);
		});

		test("switchInlineCurrent() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const result = keyboard.switchInlineCurrent("Button", "query");
			
			expect(result).toBe(keyboard);
		});

		test("webApp() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const webAppInfo = { url: "https://example.com" };
			const result = keyboard.webApp("Button", webAppInfo);
			
			expect(result).toBe(keyboard);
		});

		test("pay() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const result = keyboard.pay("Button");
			
			expect(result).toBe(keyboard);
		});

		test("requestContact() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const result = keyboard.requestContact("Button");
			
			expect(result).toBe(keyboard);
		});

		test("requestLocation() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const result = keyboard.requestLocation("Button");
			
			expect(result).toBe(keyboard);
		});

		test("requestPoll() should return this for chaining", () => {
			const keyboard = new Keyboard();
			const result = keyboard.requestPoll("Button", "quiz");
			
			expect(result).toBe(keyboard);
		});

		test("should chain multiple methods together", () => {
			const keyboard = new Keyboard();
			keyboard
				.text("Button 1", "callback1")
				.url("Button 2", "https://example.com")
				.row()
				.text("Button 3", "callback3");
				
			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([
				[
					{ text: "Button 1", callback_data: "callback1" },
					{ text: "Button 2", url: "https://example.com" }
				],
				[
					{ text: "Button 3", callback_data: "callback3" }
				]
			]);
		});
	});

	describe("Complex keyboard layouts", () => {
		test("should create a complex layout with multiple rows and different button types", () => {
			const keyboard = new Keyboard();
			keyboard
				.text("Button 1", "callback1")
				.url("Button 2", "https://example.com")
				.row()
				.text("Button 3", "callback3")
				.text("Button 4", "callback4")
				.row()
				.url("Button 5", "https://example2.com");

			const markup = keyboard.inline();
			
			expect(markup.inline_keyboard).toEqual([
				[
					{ text: "Button 1", callback_data: "callback1" },
					{ text: "Button 2", url: "https://example.com" }
				],
				[
					{ text: "Button 3", callback_data: "callback3" },
					{ text: "Button 4", callback_data: "callback4" }
				],
				[
					{ text: "Button 5", url: "https://example2.com" }
				]
			]);
		});
	});
});