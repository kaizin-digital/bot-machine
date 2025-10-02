# Project: bot-machine

## Project Overview

This project is the implementation of **BotExpress**, a Node.js/Bun framework for rapid Telegram bot development. The framework is inspired by modern web frameworks like Express.js and React, and it emphasizes a clean, decoupled architecture.

The goal is to create a hybrid system that supports both simple, stateless command handling (like a traditional MVC router) and complex, stateful, multi-step dialogues (using a state machine or "FlowController").

The UI (chat messages) is described declaratively using pure "component" functions that receive data (`props`) and return a serializable object describing the message for the Telegram API.

The framework is designed to be completely separate from the application's business logic. It handles Telegram API interaction, routing, session management, and rendering, while the core business logic (e.g., written with SotaJS) is plugged in as an external service.

## Key Components

*   **`Router` (Stateless Router):** The main entry point for incoming Telegram `update` objects. It routes updates to the appropriate handlers (`onCommand`, `onCallbackQuery`, `onText`, etc.).
*   **`Context` (ctx object):** An abstraction over the Telegram `update`, providing a convenient API for replying, editing messages, managing sessions, and entering stateful flows.
*   **`FlowController` (State Machine):** Manages complex, multi-step dialogues. It's configured with states, where each state has a `component` for rendering, an optional `onEnter` query to fetch data, and `onAction` handlers to process user input.
*   **`Component`:** A simple async function that takes `props` and returns a `MessagePayload` object, which describes the message to be sent to the Telegram API (text, buttons, etc.).
*   **`SessionManager` (Middleware):** Manages user sessions, with a default in-memory store and the ability to plug in persistent stores (like Redis) for production.

## Development Conventions

*   **Runtime:** The project uses **Bun** as the primary JavaScript runtime. See `CLAUDE.md` for specific API and CLI usage guidelines (e.g., `Bun.serve`, `bun test`, `bun --hot`).
*   **Architecture:** The framework follows the principles outlined in `TELEGRAM_FRAMEWORK_SPEC.md`, separating the presentation/dialogue logic from the core business logic.
*   **Business Logic Integration:** The framework is designed to consume a core written in **SotaJS**. Interaction happens by calling Command and Query functions and receiving DTOs in return.

## Building and Running

To install dependencies:

```bash
bun install
```

To run the main application:

```bash
bun run index.ts
```

To run with hot-reloading during development:
```bash
bun --hot index.ts
```