# Gridline hero

## Component

`GridlineHero` is a landing-page hero for a developer tool, set on a strict 12-column grid: a five-column message (eyebrow, headline, subline, one primary action, three stats) beside a seven-column release log rendered as a real table. The first release with `status: "building"` is live: its elapsed time ticks in monospace, a one-pixel accent line fills under it, and its status cross-fades to Live when the build finishes. Under reduced motion it renders the finished state immediately.

## Props

| Prop            | Type                                 | Default                                | Description                                                                 |
| --------------- | ------------------------------------ | -------------------------------------- | --------------------------------------------------------------------------- |
| `eyebrow`       | `string`                             | `"Halden release desk"`                | Small uppercase label above the grid rule.                                  |
| `headline`      | `string`                             | `"Releases you can read at a glance."` | The one message; keep it under 10 words.                                    |
| `subline`       | `string`                             | Deploy summary sentence                | Supporting sentence under the headline.                                     |
| `ctaLabel`      | `string`                             | `"Start a free workspace"`             | Label of the only primary action.                                           |
| `ctaHref`       | `string`                             | `"#start"`                             | Where the primary action goes.                                              |
| `note`          | `string`                             | `"No card required. 14-day trial."`    | Quiet text beside the action.                                               |
| `stats`         | `{ value: string; label: string }[]` | Three build stats                      | Figures under the action; three fit the grid best.                          |
| `logTitle`      | `string`                             | `"Production"`                         | Title of the release log panel.                                             |
| `releases`      | `GridlineRelease[]`                  | Four releases                          | Rows of the log. One row with `status: "building"` gets the live treatment. |
| `startProgress` | `number`                             | `0.38`                                 | Where the in-flight build starts, from 0 to 1.                              |
| `className`     | `string`                             | `""`                                   | Extra classes for the `<section>`.                                          |

`GridlineRelease` is `{ version: string; title: string; owner: string; durationSeconds: number; status: "live" | "rolled-back" | "building" }`.

## Tokens

Reads `--iu-background` (section), `--iu-surface` (log panel), `--iu-border` (grid rules and row lines), `--iu-foreground` (text and the primary button fill), `--iu-muted` (labels and secondary text), `--iu-accent` (only the in-flight build: its dot and progress line, plus focus rings), `--iu-radius` (capped at 6px for the button and panel), `--iu-font` and `--iu-density` (row height). Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the build animation and status cross-fade) and `lucide-react` (arrow, check and rollback icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/gridline-hero` (or copy `component.tsx` to `components/iloveui/gridline-hero.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens` adds them).
3. Render `<GridlineHero />` at the top of your landing page and pass your own `headline`, `subline`, `ctaLabel` and `ctaHref`.
4. Map your real deploys to `releases`. Set `status: "building"` on the deploy in progress, or on none to show a quiet log.
5. Keep exactly one primary action; put secondary links in your navigation instead.

## Customization ideas

- Swap the release log for an incident timeline: `status` becomes resolved, investigating or monitoring.
- Feed `releases` from your API and drive `startProgress` from the real build percentage.
- Add a fifth column for the commit hash in monospace on wide screens with another `@md:table-cell`.
- Replace the stats with plan prices for a pricing-led hero.
- Raise `--iu-density` to 1.2 for a calmer, airier log on marketing pages.
