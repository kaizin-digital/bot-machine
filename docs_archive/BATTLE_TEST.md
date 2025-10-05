
# Battle-Test Checklist: BotExpress vs. No-Code Builders

**Rationale:** We are comparing our framework against the capabilities of no-code platforms to evaluate its Developer Experience (DX) and readiness to become the foundation for a low-code solution.

**Rating:**
*   ✅ **Implemented** - The feature is implemented and easy to use.
*   🟡 **Partial** - The feature is implemented but requires refinement for convenience or completeness.
*   ❌ **Missing** - The feature is not implemented.

---

### 1. Core Bot Logic & Flow Control

| Requirement | Description | Rating | Comments |
| :--- | :--- | :--- | :--- |
| **Visual Builder Analogy** | The ability to easily describe complex, branching dialogues in code. | ✅ | The `FlowController` with its states, `onAction`, and `onText` serves as a direct code-based analogue to a visual builder. |
| **Keyword Triggers** | The bot should react to specific keywords in user messages. | ✅ | `Router.onText()` for global triggers, `FlowState.onText` for triggers within a dialogue. |
| **Default Reply** | A fallback mechanism if no other handler catches the user's message. | ❌ | There is currently no global "catch-all" handler. In a flow, unmatched text simply results in a re-render of the current state. |
| **Reusable Flows** | The ability to reuse parts of dialogues (components, states) in different places. | 🟡 | Components are reusable. States and flows are not yet. Requires architectural thought. |
| **Sequences/Campaigns** | The ability to send a user a series of messages with a time delay. | ❌ | Functionality for delayed jobs and "campaigns" is missing. |

### 2. Message Handling & Content

| Requirement | Description | Rating | Comments |
| :--- | :--- | :--- | :--- |
| **Rich Content (Media)** | Easy sending of images, videos, files. | 🟡 | The underlying `telegram-client` supports this, but `bot-machine` provides no high-level abstractions. Requires calling `ctx.client.sendPhoto(...)` directly. |
| **Dynamic Content** | The ability to use variables (e.g., user's name, data from an API) in messages. | ✅ | Components accept `props`, which can be populated with any dynamic data. |
| **Message Formatting** | Easy support for Markdown/HTML. | ✅ | The `MessagePayload` has a `parse_mode` field. |
| **Message Delays** | The ability to simulate typing and add artificial delays between messages. | ❌ | Missing. Can be implemented manually via `setTimeout`, but it's not an out-of-the-box feature. |

### 3. User Interaction

| Requirement | Description | Rating | Comments |
| :--- | :--- | :--- | :--- |
| **Buttons (Inline & Reply)** | Simple creation of inline and reply keyboards. | 🟡 | `MessagePayload` supports `inline_keyboard`. The code can become verbose for complex keyboards. No helpers/builders exist. |
| **Input Validation** | Validating user input (e.g., email, phone) and re-prompting on failure. | 🟡 | Can be implemented within an `onText` handler using `refresh: true`, but there are no built-in validators or convenient abstractions. |
| **User Data Collection** | Easily capture user input and save it to their session or a database. | ✅ | `onText` combined with a `command` and `ctx.session` is well-suited for this. |

### 4. Integration & Data

| Requirement | Description | Rating | Comments |
| :--- | :--- | :--- | :--- |
| **API Integration** | The ability to easily call external APIs at any point in a dialogue. | ✅ | The `onEnter` and `command` properties in `FlowState` are perfect for this. |
| **User Segmentation (Tagging)** | The ability to "tag" users based on their actions for future segmentation. | 🟡 | Can be implemented manually via `ctx.session.tags = [...]`, but no dedicated abstraction exists. |
| **Persistent Storage** | A simple way to switch from in-memory session storage to a persistent one (e.g., DB, Redis). | ✅ | The architecture with `ISessionStore` fully supports this. It only requires a custom adapter to be written. |

### 5. Developer Experience (DX)

| Requirement | Description | Rating | Comments |
| :--- | :--- | :--- | :--- |
| **Declarative UI** | The description of messages and buttons is separate from the logic. | ✅ | `Component` functions returning a `MessagePayload` fully realize this principle. |
| **Minimal Boilerplate** | How much code is needed to get started and for simple tasks. | ✅ | `bun run index.ts` to start. The flow definition in `main.flow.ts` is reasonably concise. |
| **Extensibility** | The ease of adding custom `middleware` or session stores. | ✅ | `router.use()` and `ISessionStore` provide good extensibility. |

