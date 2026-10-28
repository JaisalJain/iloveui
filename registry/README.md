# Authoring catalog designs

This is the contract every design in `registry/designs/` meets. CLAUDE.md section 9 is the source of truth; this file turns it into concrete, checkable rules. `pnpm validate-registry` and `pnpm design:check <slug>` enforce most of them; the rest are reviewed by eye.

## The bar

A design is a complete, real-world piece of product UI that a developer pastes in and ships. It must look like it came out of the best product teams working today, and it must make someone stop scrolling.

- **One signature moment.** Every design has one idea people remember: a price that rolls when billing switches to yearly, a sparkline that draws itself once, a submit button that becomes a progress ring and then a check, a palette that previews the result under the cursor, a tool call that unfolds into its arguments. The moment explains state or points at the one thing that matters. It is never decoration.
- **Show the product.** Visuals are miniature, believable interfaces built from CSS and SVG: a deploy log, an invoice, a chart with honest data. Never abstract filler.
- **Typographic confidence.** Big contrast in scale, exact alignment, tabular figures, `text-balance` on headings and `text-pretty` on paragraphs.
- **Dark mode is designed, not inverted.** Surfaces step lighter with elevation, borders take over from shadows, large accent areas lose saturation, focus rings stay visible.
- **Real content.** Invented but plausible brands, people, roles, numbers and dates (2025–2026). Numbers have realistic variance (12,847 rather than 10,000). Original brand names: never the placeholder words CLAUDE.md section 16 lists, never famous sample brands.
- **Distinct.** No two designs in a category share a layout or an interaction.

## Folder

```
registry/designs/<category>/<slug>/
  meta.json        metadata (validated by registry/schema.ts)
  component.tsx    the React + Tailwind v4 component (what buyers install)
  component.html   the same design as plain HTML + Tailwind v4 + vanilla JS
  preview.tsx      renders the component with demo data for every declared state
  ai-prompt.md     instructions for an AI assistant integrating the design
  notes.md         usage notes and the taste self-review
```

`<category>` is a slug from `registry/definitions.ts`. `<slug>` is kebab-case, unique across the whole catalog, and descriptive (`ledger-pricing`, `relay-agent-console`). The component name is the PascalCase slug (`LedgerPricing`).

## meta.json

```json
{
  "slug": "ledger-pricing",
  "name": "Ledger pricing",
  "category": "pricing",
  "styleFamily": "swiss-minimal",
  "tier": "free",
  "description": "Three plans on a strict grid with a yearly toggle that rolls the prices and states the saving.",
  "tags": ["pricing", "billing-toggle", "comparison"],
  "states": ["default", "loading", "error", "success"],
  "hasMotion": true,
  "dependencies": ["motion", "lucide-react"],
  "registryDependencies": ["@iloveui/tokens"],
  "version": "1.0.0",
  "createdAt": "2026-10-26"
}
```

- `description` is at most 160 characters and says what it is plus its signature moment.
- `tags`: 3 to 8 kebab-case words people would search for.
- `states` starts with `default` and lists only states `preview.tsx` actually renders differently (see States).
- `dependencies` lists exactly the packages `component.tsx` imports besides React. `hasMotion` is true when the design animates at all (motion library or CSS).
- `registryDependencies` always contains `@iloveui/tokens`.

## Tokens

Designs are themed only through these CSS variables. Theme Lab sets them for previews; buyers add them once with `npx shadcn@latest add @iloveui/tokens` or by pasting `theme.css`.

| Token                    | Meaning                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `--iu-accent`            | brand color for primary fills, active markers, focus rings, key icons |
| `--iu-accent-foreground` | text and icons on `--iu-accent` fills                                 |
| `--iu-background`        | page background                                                       |
| `--iu-surface`           | cards, panels, inputs                                                 |
| `--iu-border`            | hairlines and dividers                                                |
| `--iu-foreground`        | primary text                                                          |
| `--iu-muted`             | secondary text (meets 4.5:1 on background and surface)                |
| `--iu-radius`            | base corner radius                                                    |
| `--iu-font`              | font family stack                                                     |
| `--iu-density`           | spacing multiplier: `1` comfortable, `0.8` compact                    |

Use Tailwind v4's variable shorthand:

```
bg-(--iu-surface)  text-(--iu-foreground)  text-(--iu-muted)  border-(--iu-border)
bg-(--iu-accent) text-(--iu-accent-foreground)  outline-(--iu-accent)
rounded-(--iu-radius)  rounded-[min(var(--iu-radius),6px)]  rounded-[max(var(--iu-radius),16px)]
font-(family-name:--iu-font)
bg-(--iu-accent)/10   bg-[color-mix(in_oklab,var(--iu-accent)_8%,var(--iu-surface))]
py-[calc(12px*var(--iu-density))]   gap-[calc(16px*var(--iu-density))]
```

Rules:

- Never `bg-[--x]` (Tailwind v3 syntax, silently broken in v4) and never `font-(--iu-font)` (that sets font-weight).
- **No hard-coded colors**: no hex, `rgb()`, `hsl()` or `oklch()` literals, and no Tailwind palette colors, with two exceptions. `white`, `black`, `transparent` and `current` are allowed for overlays, scrims and shadows. Semantic status hues (`red`, `rose`, `emerald`, `green`, `amber`) are allowed only to mean error, success or warning, always paired with an icon or text and a deliberate `dark:` value.
- **Accent is not body text.** Small text never uses `--iu-accent` as its color on `--iu-background` or `--iu-surface`; buyers can pick any accent. Use the accent for fills (with `--iu-accent-foreground` text), indicators, icons, borders, focus rings and display text of 24px or more.
- Control boundaries (inputs, toggles, checkboxes) keep 3:1 against their background: use `border-(--iu-foreground)/35` or stronger, not `--iu-border`.
- Read `--iu-font` on the root element and `--iu-radius` and `--iu-density` somewhere meaningful; the validator checks that all three appear.
- The family's radius range is expressed with `min()` and `max()` around `--iu-radius` (see `style-families.md`).
- Serif and mono come from Tailwind's `font-serif` and `font-mono`, which the buyer's project defines; previews map them to Instrument Serif and JetBrains Mono.

## Light and dark

The `dark:` variant targets a `.dark` ancestor (the shadcn convention; previews set it on `<html>`). Token values already switch per mode, so most of the work is automatic. Use `dark:` for deliberate differences: borders instead of shadows, softer large accent areas, lighter surface steps.

## Interaction and accessibility

- Semantic HTML first (`button`, `a`, `nav`, `ul`, `table`, `form`, `label`, `fieldset`); ARIA only where native semantics fall short. Every control has an accessible name; icon-only buttons get `aria-label`.
- **Hover** styles use `pointer-fine:hover:` (and `pointer-fine:group-hover:`), so they apply only with a hovering, precise pointer. Bare `hover:` is rejected by the validator.
- **Focus** is always visible: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)` on every interactive element (or an equivalent ring that keeps 3:1).
- **Targets**: at least 24×24px everywhere and 40×40px on touch (`pointer-coarse:min-h-10 pointer-coarse:min-w-10`, or simply `h-10`).
- **Keyboard**: everything works without a mouse. Menus, tabs, listboxes and dialogs follow the WAI-ARIA Authoring Practices keyboard patterns (arrows, Home/End, Escape, focus return).
- Contrast: text 4.5:1, large text and UI parts 3:1, in both modes, with the default theme. `pnpm design:check` runs axe on every state, width and mode.
- Responsive at 375, 768 and 1440 with no horizontal scrolling. Prefer container queries (`@container`, `@md:`) for components that can land in any column, viewport breakpoints for full-width sections.
- Never nest `min()` or `max()` with percentages inside `calc()` (also in arbitrary values): Lightning CSS 1.33 crashes on it. Put the `min()` in a custom property and use `var()` inside the `calc()`.
- Tailwind CSS 4.1 is the floor: avoid utilities introduced in 4.2 or later (`scrollbar-gutter-*`, `inset-s-*`, `font-features-*`); write arbitrary properties instead (`[scrollbar-gutter:stable]`).

## Motion

Motion explains a state change or draws attention to one thing, and every design works with motion turned off.

- Import from `motion/react` only. Wrap the component's root in:
  ```tsx
  const reduceMotion = useReducedMotion();
  <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }}>
  ```
  `reducedMotion="user"` makes transforms and layout instant; the zero-duration transition makes opacity and color instant too.
- **Server-rendered content must be visible without JavaScript.** Never `initial={{ opacity: 0 }}` on content present at first render. Use `initial={false}` and `<AnimatePresence initial={false}>`; animate only what changes after mount.
- CSS transitions and keyframes get `motion-reduce:transition-none` / `motion-reduce:animate-none`.
- Animations are interruptible and never block input. Durations follow the family (roughly 80–500ms).
- Loops are allowed only as honest indicators (a streaming caret, a live status, a loading spinner); they stop under reduced motion and pause when offscreen (`IntersectionObserver`).

## States

`states` in meta.json are the states `preview.tsx` renders. Each non-default state must render visibly different markup from `default` (the build compares them).

- Data states come from props: `status="loading" | "error" | "success"`, an empty `items` array for `empty`, `disabled` for `disabled`.
- Interaction states (`hover`, `focus`, `active`) are declared only when the design can render them on demand, through a documented `forceState?: "hover" | "focus" | "active"` prop that sets `data-force-state` and is mirrored in the classes (`pointer-fine:hover:bg-x data-[force-state=hover]:bg-x`). Cards and buttons use this; most other designs skip these states.
- Loading states keep layout (skeletons match the final layout; buttons keep their width). Skeletons are static blocks, not pulsing.
- Error and empty states have honest copy and one helpful action.

## component.tsx

```tsx
"use client";

import { useState } from "react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";

export type LedgerPricingProps = {
  plans?: Plan[];
  status?: "idle" | "loading" | "error" | "success";
  onSelectPlan?: (planId: string, billing: "monthly" | "yearly") => void;
  className?: string;
};

export function LedgerPricing({
  plans = DEFAULT_PLANS,
  status = "idle",
  onSelectPlan,
  className = "",
}: LedgerPricingProps) {
  // ...
}

export default LedgerPricing;
```

- First line `"use client";`. Imports only from `react`, `motion/react` and `lucide-react`: no relative imports, no `@/` paths, no other packages, no `cn()` (inline a tiny `cx` helper if needed).
- One file. A named export and a default export of the same component; the props type is exported too.
- Typed props with realistic defaults for all content, so `<LedgerPricing />` renders the full design. Callbacks for every action a real app would handle.
- The root element sets `font-(family-name:--iu-font) text-(--iu-foreground)` and accepts `className`.
- No `<img>`, no external URLs (the SVG namespace is fine), no `fetch`, no storage, no global listeners without cleanup. Visuals are CSS, inline SVG, monogram avatars and code-drawn data.
- When touching the DOM directly, insert nodes with `appendChild` and `insertBefore`, not `append`, `prepend`, `before` or `after`. Projects that run `wrangler types` (this one, and buyers deploying to Cloudflare Workers) get the Workers runtime's HTMLRewriter `Element` as a global type, which replaces those four DOM methods.
- lucide icons at `size={16} strokeWidth={1.5}` next to 14–16px text; larger icons scale proportionally. Brand icons do not exist in lucide 1.x: draw marks as inline SVG.

## component.html

The same design as one standalone document: Tailwind v4 classes and vanilla JS, no framework.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ledger pricing · iloveui</title>
    <!-- Tailwind CSS v4 in the browser so this file works on its own; in a project, use your Tailwind build. -->
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3"></script>
    <style type="text/tailwindcss">
      @custom-variant dark (&:where(.dark, .dark *));
      /* iloveui:tokens:start */
      :root { ... }
      .dark { ... }
      /* iloveui:tokens:end */
    </style>
  </head>
  <body class="bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)">
    <!-- iloveui:component:start -->
    <section>...</section>
    <!-- iloveui:component:end -->
    <script>
      /* vanilla JS for the interactions */
    </script>
  </body>
</html>
```

- The token block between the `iloveui:tokens` markers holds all ten tokens for `:root` and `.dark`, with the default theme values (copy them from `registry/preview-base.css`). Copy and download swap in the buyer's Theme Lab values there.
- The markup between the `iloveui:component` markers mirrors `component.tsx` in the default state with the same classes; the script implements the same interactions with the same keyboard support and respects `prefers-reduced-motion`.
- No other external resources. `pnpm design:check` renders it with compiled CSS and compares it with the React version.

## preview.tsx

```tsx
import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import LedgerPricing from "./component";

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <PreviewCanvas>
          <LedgerPricing status="loading" />
        </PreviewCanvas>
      );
    case "error":
      return (
        <PreviewCanvas>
          <LedgerPricing status="error" />
        </PreviewCanvas>
      );
    default:
      return (
        <PreviewCanvas>
          <LedgerPricing />
        </PreviewCanvas>
      );
  }
}
```

- Renders the component with demo data. It may wire demo behaviour (a submit that resolves after 900ms) so the live preview feels real.
- `PreviewCanvas` gives small components a centered stage with padding; full-width sections render without it.
- It is never shipped to buyers and may import from `@/registry/*`.

## ai-prompt.md

Exactly these sections, written for an AI coding assistant integrating the design into an existing app:

```md
# Ledger pricing

## Component

## Props

## Tokens

## Dependencies

## Integration steps

## Customization ideas
```

`Props` is a table (prop, type, default, description). `Integration steps` starts with `npx shadcn@latest add @iloveui/<slug>` and covers wiring callbacks and states. `Customization ideas` lists 3–5 concrete variations.

## notes.md

```md
# Ledger pricing

## Usage notes

- When to use it, the data it expects, keyboard and screen reader behaviour, responsive behaviour, states.

## Taste self-review

- One clear focal point: Yes. <what it is>
- Spacing on the 4px scale: Yes. <how>
- Belongs in a Linear, Stripe or Vercel product: Yes. <why>
- Meets its category brief: Yes. <each brief point and where it is met>
- Distinct from every other design in its category: Yes. <what differs>
```

Any answer other than Yes means the design is redone before it is committed.

## Checking a design

```
pnpm design:check <slug>     renders every state at 375/768/1440 in light and dark (React and HTML),
                             runs axe, checks for horizontal overflow and writes screenshots
pnpm validate-registry       validates every design folder and the catalog as a whole
pnpm validate-registry --only <slug>   validates one design
pnpm exec prettier --write registry/designs/<category>/<slug>
```
