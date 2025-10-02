
# `landing-express`: An AI-Driven Workflow for Landing Page Generation

## Core Principle

Development follows a **top-down, schema-first** approach. We begin by describing **WHAT** a landing page is (its data structures and components) before defining **HOW** it is populated with content and rendered. This workflow is designed for rapid, scalable, and error-proof generation of page variations, making it ideal for AI-driven development and CPA offer management.

The process of creating a new landing page variant based on a marketing hypothesis (e.g., new geo, new audience segment) is broken down into the following steps.

---

### Step 1: Define the "Landing Page Schema" (Schema-First)

This is the foundational contract. We define a master schema that describes every possible element and variation on a landing page. This becomes the single source of truth for the entire system.

*AI Agent Action: Create `schema/landing.ts`*
```typescript
import { z } from 'zod';

// Define each block as a schema
const HeadlineSchema = z.object({
  text: z.string(),
  color: z.string().optional(),
});

const CtaButtonSchema = z.object({
  text: z.string(),
  link: z.string().url(),
});

// Assemble the master schema for the entire page
export const LandingPageSchema = z.object({
  lang: z.enum(['en', 'de', 'es']),
  title: z.string(), // For the <title> tag
  headline: HeadlineSchema,
  subheadline: z.string().optional(),
  cta: CtaButtonSchema,
  testimonials: z.array(z.object({ author: z.string(), text: z.string() })).optional(),
});

// Export the inferred type for use throughout the codebase
export type LandingPageData = z.infer<typeof LandingPageSchema>;
```
**Result of Step 1:** A single, machine-readable source of truth that dictates what a landing page can be. No invalid page structures can be created.

---

### Step 2: Create a Library of UI Components

These are the visual building blocks (e.g., React components). They are "dumb" components that are only responsible for rendering data. Their props are strictly typed based on the schemas defined in Step 1.

*AI Agent Action: Create `components/Headline.tsx`*
```tsx
import type { LandingPageData } from '../schema/landing';

// The component's props are strictly typed from the schema!
type Props = LandingPageData['headline'];

export function Headline({ text, color }: Props) {
  return <h1 style={{ color: color ?? 'black' }}>{text}</h1>;
}
```
**Result of Step 2:** A library of reusable, type-safe UI components that are decoupled from the business logic.

---

### Step 3: Implement "Hypothesis-to-Data" Transformers

This is the core business logic layer. Here, we write functions that take a marketing "hypothesis" (e.g., geo, audience segment) as input and produce a valid `LandingPageData` object as output.

*AI Agent Action: Create `logic/transformers.ts`*
```typescript
import { LandingPageSchema, type LandingPageData } from '../schema/landing';

interface Hypothesis {
  geo: 'DE' | 'US';
  segment: 'gamers' | 'students';
}

export function generatePageDataForHypothesis(hypothesis: Hypothesis): LandingPageData {
  let headlineText = "Get Your Amazing Product!";
  if (hypothesis.geo === 'DE') {
    headlineText = "Holen Sie sich Ihr tolles Produkt!";
  }
  if (hypothesis.segment === 'gamers') {
    headlineText += " Level Up Your Game!";
  }

  const data = {
    lang: hypothesis.geo === 'DE' ? 'de' : 'en',
    title: "Amazing Product",
    headline: { text: headlineText },
    cta: { text: "Buy Now!", link: "https://..." },
  };

  // CRITICAL: Validate the generated object against the master schema before returning.
  // This guarantees that the logic cannot produce an invalid page.
  return LandingPageSchema.parse(data);
}
```
**Result of Step 3:** A repeatable and reliable way to generate page *content* for any combination of marketing parameters.

---

### Step 4: Assemble the Page (Composition Root)

This is the final step where the page is rendered by combining the data from Step 3 with the UI components from Step 2.

*AI Agent Action: Create `pages/LandingPage.tsx`*
```tsx
import { generatePageDataForHypothesis } from '../logic/transformers';
import { Headline, CtaButton } from '../components';
import type { LandingPageData } from '../schema/landing';

// The main page component that receives the data and renders child components
function LandingPage({ data }: { data: LandingPageData }) {
  return (
    <html lang={data.lang}>
      <head><title>{data.title}</title></head>
      <body>
        <Headline {...data.headline} />
        <CtaButton {...data.cta} />
        {/* ... and so on for other components */}
      </body>
    </html>
  );
}

// This function would be called by your server or static site generator
export function buildLandingPage(hypothesis) {
  const pageData = generatePageDataForHypothesis(hypothesis);
  const pageHtml = renderToString(<LandingPage data={pageData} />);
  return pageHtml;
}
```

### Conclusion

This workflow provides a systematic solution to the problem of managing numerous landing page variations. It establishes a predictable, scalable, and error-resistant process that is perfectly suited for automation and delegation to AI agents. The schema acts as the central contract, ensuring consistency across logic, UI, and the final rendered output.
