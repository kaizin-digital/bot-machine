
# Future Concepts & Hypotheses

This document contains forward-looking ideas and architectural hypotheses that are worth exploring in the future to further improve the framework's Developer Experience (DX).

## 1. Functional/Component-Based Text Builder

**Hypothesis:** A functional, component-based syntax for building messages could offer superior composability and readability compared to a purely fluent (chainable) API, especially for highly dynamic and complex messages.

### Core Concept

Instead of (or in addition to) the fluent `new Text().b('Hello').i('World')` API, we could offer a builder function that accepts a function as an argument. This argument function, in turn, receives the formatting methods as its own arguments, allowing for a syntax reminiscent of React functional components.

### Proposed Syntax Example

```typescript
// `txt` is the main builder function
const message = txt(({ b, i, l, n, user }) => [
  b(['Hello, ', user.firstName, '!']), // Methods can accept strings or arrays of fragments
  n(), // Newline
  i('Welcome to our bot.'),
  n(2), // Two newlines
  l('Visit our website', 'https://example.com'),
]);

// It could even allow for easy conditional logic and mapping
const welcomeMessage = (user) => txt(({ b, i, n, p }) => [
  b(['Welcome, ', user.name, '!']),
  n(),
  user.is_premium ? i('Thanks for being a premium member.') : p('Check out our premium offers.'),
  n(),
  p('Your items:'),
  ...user.items.map(item => p(`- ${item.name}`)), // Composition with standard JS
]);
```

### Key Ideas to Explore

*   **Composition:** The primary benefit is the ability to compose messages from smaller, reusable functional components.
*   **JavaScript-Native Logic:** Using a function allows developers to use standard JavaScript (`if/else`, `.map`, `...spread`) directly within the message definition, which is more powerful and familiar than a chained API.
*   **Readability:** For deeply nested or conditional UIs, this syntax can be significantly more readable than a long chain of method calls.
*   **`row` concept:** The user mentioned a `row` function. This could be explored as a way to logically group elements, although text in Telegram is linear. It might be a purely organizational tool or could imply specific styling/spacing.

**Next Steps (Future):**

1.  Build a Proof of Concept (PoC) for this API.
2.  Compare the DX of this functional style against the fluent builder for several complex message examples.
3.  Decide if this should replace, or be offered as an alternative to, the fluent builder API.
