# Kestrel signal bento

## Component

`KestrelSignalBento` is a dense features section for an observability or operations product. Five panels share one time cursor: a latency chart (p50, p95 and p99 over an hour, with a deploy marker and an incident window), four golden-signal KPI tiles with sparklines, a log tail, a table of the slowest endpoints with inline bars, and an error-budget panel. Scrubbing the chart with the pointer or the arrow keys moves the cursor, and every other panel re-reads that minute: KPI values and deltas, the dot on each sparkline, the log lines, the endpoint ranking and the budget burn rate. A filter toggle narrows the log tail to errors and warnings, with an empty state when a minute has none.

## Props

| Prop              | Type                                       | Default                                    | Description                                                                        |
| ----------------- | ------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `kicker`          | `string`                                   | `"Kestrel observability"`                  | Small uppercase label.                                                             |
| `headline`        | `string`                                   | `"Scrub one minute. Every panel follows."` | Section heading.                                                                   |
| `subline`         | `string`                                   | Product summary sentence                   | Paragraph under the heading.                                                       |
| `minutes`         | `KestrelMinute[]`                          | A generated hour with an incident          | One entry per minute: `p50`, `p95`, `p99`, `rpm`, `errorRate`, `apdex`, `cpu`.     |
| `startTime`       | `string`                                   | `"14:00"`                                  | Clock label of the first minute.                                                   |
| `defaultMinute`   | `number`                                   | `42`                                       | Minute the cursor starts on.                                                       |
| `deploy`          | `{ minute: number; version: string }`      | `{ minute: 37, version: "v4.18.2" }`       | Deploy marker on the chart.                                                        |
| `incident`        | `{ from: number; to: number; id: string }` | `{ from: 38, to: 46, id: "INC-2291" }`     | Shaded incident window.                                                            |
| `endpoints`       | `KestrelEndpoint[]`                        | Five API routes                            | Endpoints with their latency weight, weight during the incident and traffic share. |
| `budgetRemaining` | `number`                                   | `61.4`                                     | Error budget left in the 30-day window, in percent.                                |
| `status`          | `"idle" \| "loading"`                      | `"idle"`                                   | `loading` keeps every panel in place with static skeletons and `aria-busy`.        |
| `onMinuteChange`  | `(index: number) => void`                  | none                                       | Called when the cursor moves.                                                      |
| `className`       | `string`                                   | `""`                                       | Extra classes for the `<section>`.                                                 |

## Tokens

Reads `--iu-background` (section), `--iu-surface` (panels), `--iu-border` (panel edges, table and log rules), `--iu-foreground` (text, chart lines, bars, zebra rows from a faint tint), `--iu-muted` (labels, axis, secondary values), `--iu-accent` (the time cursor, its dots, sparkline markers, the active log filter and focus rings), `--iu-accent-foreground` (text on the active filter), `--iu-radius` (capped at 6px), `--iu-font` and `--iu-density` (tile padding, log and table row height). Status colors (red, amber, emerald) appear only for errors, warnings and healthy deltas, always with an icon, sign or word.

## Dependencies

`react` and `lucide-react` (delta arrows, deploy, incident and budget icons). No chart library: lines and sparklines are inline SVG. Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/kestrel-signal-bento` (or copy `component.tsx` into `components/iloveui/kestrel-signal-bento.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<KestrelSignalBento />` on your landing page, or pass a real hour of metrics in `minutes` to use it as a live overview.
4. Set `deploy` and `incident` from your release and incident systems; omit the incident by pointing `from` past the last minute.
5. While data loads, render with `status="loading"`; wire `onMinuteChange` to fetch logs for the selected minute if you replace the generated lines.

## Customization ideas

- Swap the endpoint table for queues or database shards; keep the inline bars and the sort by the worst value.
- Add a second cursor for comparison (before and after a deploy) and show both values in each KPI.
- Make the log lines links that open a trace view filtered to the selected minute.
- Replace CPU with memory or saturation depending on what pages your on-call.
- Use `--iu-density: 0.8` for an even tighter wall-display version.
