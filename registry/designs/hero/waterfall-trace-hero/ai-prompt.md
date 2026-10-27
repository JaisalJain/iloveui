# Waterfall trace hero

## Component

`WaterfallTraceHero` is a landing-page hero for a developer platform, here a distributed-tracing product. The message sits across the top (kicker, a large headline on the left, subline, one accent action and an install command on the right) above a full-width trace inspector: a request header bar, a millisecond ruler with dashed tick lines, a waterfall of spans as a keyboard-operable listbox, and a details panel for the selected span. When the inspector scrolls into view an accent playhead sweeps from 0 to the request's total while each span's bar grows as the playhead reaches it and the header timer counts up. When the sweep ends, the slowest child span turns accent, is selected, its suggested fix appears in the details panel and a verdict line states its share of the request. A Replay button runs the sweep again. Under reduced motion it renders the finished trace immediately.

## Props

| Prop             | Type                        | Default                               | Description                                                           |
| ---------------- | --------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| `kicker`         | `string`                    | `"Spanline · distributed tracing"`    | Mono label above the headline.                                        |
| `headline`       | `string`                    | `"See where every millisecond went."` | The one message; keep it under 10 words.                              |
| `subline`        | `string`                    | Product sentence                      | Supporting paragraph.                                                 |
| `ctaLabel`       | `string`                    | `"Instrument your first service"`     | Label of the only primary action.                                     |
| `ctaHref`        | `string`                    | `"#start"`                            | Where the primary action goes.                                        |
| `installCommand` | `string`                    | `"npm i @spanline/otel"`              | Command shown beside the action.                                      |
| `method`         | `string`                    | `"POST"`                              | HTTP method of the traced request.                                    |
| `route`          | `string`                    | `"/api/checkout"`                     | Route of the traced request.                                          |
| `traceId`        | `string`                    | `"7f3a0e9c…c912"`                     | Shortened trace id (shown in wide containers).                        |
| `statusLabel`    | `string`                    | `"200 OK"`                            | Response status beside a green dot.                                   |
| `region`         | `string`                    | `"prod · eu-west-1"`                  | Environment shown after the trace id.                                 |
| `spans`          | `TraceSpan[]`               | Seven checkout spans                  | The waterfall rows; the slowest span with `depth > 0` is highlighted. |
| `tickEvery`      | `number`                    | `200`                                 | Milliseconds between ruler ticks.                                     |
| `onSelectSpan`   | `(span: TraceSpan) => void` | none                                  | Called when a visitor selects a span.                                 |
| `className`      | `string`                    | `""`                                  | Extra classes for the `<section>`.                                    |

`TraceSpan` is `{ id, service, name, depth, start, duration, attributes: { key, value }[], insight? }` with `start` and `duration` in milliseconds.

## Tokens

Reads `--iu-background` (section), `--iu-surface` (inspector), `--iu-border` (row rules and frames), `--iu-foreground` (text, neutral bars at 25 to 45 percent, dashed dividers), `--iu-muted` (labels, durations, the install command), `--iu-accent` (the primary action fill, the kicker dot, the playhead, the slowest span, the selection marker and focus rings), `--iu-accent-foreground` (action label), `--iu-radius` (capped at 8px), `--iu-font` and `--iu-density` (row and header height). Status uses emerald (healthy response) and amber (the suggestion), each paired with text. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the clock, playhead, growing bars and verdict fade) and `lucide-react` (arrow, replay and suggestion icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/waterfall-trace-hero` (or copy `component.tsx` to `components/iloveui/waterfall-trace-hero.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS and `font-mono` maps to your code font.
3. Render `<WaterfallTraceHero />` at the top of your landing page and pass your `headline`, `subline`, `ctaLabel`, `ctaHref` and `installCommand`.
4. Replace `spans` with a real, anonymised trace from your product. Keep six to eight spans and give the slowest one an `insight` so the sweep ends on an answer.
5. Wire `onSelectSpan` to analytics if you want to see which spans visitors inspect.

## Customization ideas

- Turn it into a log tail: rows become log lines and the playhead becomes the live tail cursor.
- Mark a failing span with `status: "error"` and a red bar plus an "Error" label for an incident-focused product.
- Show two traces (before and after a fix) and let a toggle swap them so the bars shrink.
- Replace the ruler ticks with frame budgets (16 ms) for a frontend performance tool.
- Hide the details panel and let the waterfall take the full width on pages with less room.
