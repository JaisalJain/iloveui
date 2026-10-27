# Plumbline mega header

## Component

`PlumblineMegaHeader` is a sticky site header for a product with a deep marketing site, set on a strict 12-column grid. Top-level sections open a full-width mega menu with numbered link columns (label plus one-line description) and a featured column that draws a miniature: a spend chart against a budget line, one oversized figure, or a CLI session. Moving between sections morphs the panel to the new content height while the content shifts 4px in the direction of travel, and a 2px accent marker slides under the open section (at rest it marks the section of the current page). Below 1024px the navigation becomes a full-screen modal sheet with numbered 28px sections that expand in place, a status line and two full-width actions.

It follows the WAI-ARIA disclosure navigation pattern: each section is a button with `aria-expanded` and `aria-controls`; the current page has `aria-current="page"` and a visible "You are here" label.

## Props

| Prop              | Type                     | Default                                | Description                                                                       |
| ----------------- | ------------------------ | -------------------------------------- | --------------------------------------------------------------------------------- |
| `brand`           | `string`                 | `"Plumbline"`                          | Wordmark beside the plumb-bob mark.                                               |
| `brandHref`       | `string`                 | `"#home"`                              | Where the logo links.                                                             |
| `menus`           | `PlumblineMenu[]`        | Product, Solutions, Developers         | Sections with a mega panel: `{ id, label, columns, featured }`.                   |
| `links`           | `PlumblineLink[]`        | Customers, Pricing                     | Top-level links without a panel.                                                  |
| `currentHref`     | `string`                 | `"#alerts"`                            | The page the visitor is on. Its section gets the marker, its link `aria-current`. |
| `defaultOpenMenu` | `string \| null`         | `null`                                 | Opens one section on first render (for docs and demos).                           |
| `statusLabel`     | `string`                 | `"All systems normal · 99.98% uptime"` | Status line in the panel footer and mobile sheet.                                 |
| `statusHref`      | `string`                 | `"#status"`                            | Where the status line links.                                                      |
| `signInLabel`     | `string`                 | `"Sign in"`                            | Secondary action.                                                                 |
| `signInHref`      | `string`                 | `"#sign-in"`                           | Secondary action target.                                                          |
| `ctaLabel`        | `string`                 | `"Start free"`                         | The one primary action.                                                           |
| `ctaHref`         | `string`                 | `"#start"`                             | Primary action target.                                                            |
| `onNavigate`      | `(href: string) => void` | none                                   | Called whenever a header link is followed; use it for client-side routing.        |
| `className`       | `string`                 | `""`                                   | Extra classes for the `<header>`.                                                 |

`PlumblineColumn` is `{ title: string; links: { label: string; href: string; description?: string }[] }`. `PlumblineFeatured` is `{ kicker, title, description, href, visual: "budget" | "figure" | "terminal", figure?, lines? }`.

## Tokens

Reads `--iu-background` (header, panel and sheet), `--iu-border` (rules and column dividers), `--iu-foreground` (text, the primary button fill, the chart's highlighted bar), `--iu-muted` (descriptions, indices, labels), `--iu-accent` (only the section marker, the mobile current-section bar and focus rings), `--iu-radius` (capped at 6px), `--iu-font` and `--iu-density` (link row height). Add them with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (marker slide, panel height morph and content cross-fade, sheet sections) and `lucide-react` (chevrons, menu, close and arrow icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/plumbline-mega-header` (or copy `component.tsx` to `components/iloveui/plumbline-mega-header.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<PlumblineMegaHeader />` as the first element of your marketing layout; it is `sticky top-0` and the scrim assumes the header sits at the top of the viewport.
4. Map your information architecture to `menus` (two or three columns each, two to four links per column) and pass the current route as `currentHref`.
5. With a client router, pass `onNavigate={(href) => router.push(href)}` and prevent default in your own link wrapper if needed; the header closes its panel and sheet on every navigation.
6. Keep exactly one primary action in `ctaLabel`; put everything else in the panels.

## Customization ideas

- Add a fourth featured visual, such as a short customer quote with a monogram, by extending `PlumblineFeatured["visual"]`.
- Show a "New" index beside a column title for a launch week.
- Feed `statusLabel` from your status page API so the footer line reports real incidents with an amber dot.
- Put a search button before Sign in that opens your command palette.
- Raise `--iu-density` to 1.2 for an airier panel on large marketing sites.
