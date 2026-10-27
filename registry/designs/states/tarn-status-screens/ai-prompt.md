# Tarn status screens

## Component

`TarnStatusScreens` is a full-page status and error screen for a developer platform, with five kinds that share one frame: a header with the live system status, a huge mono status code in corner ticks, an honest title and paragraph, exactly one action, a request log panel that shows the machine's side of the story, and a footer with request id, region and timestamp. Each kind's log is specific: the 404 diffs the mistyped slug against the closest project, the 500 shows the upstream failure and a ticking incident timeline, maintenance shows a stepped 20-segment progress bar and checklist, the 429 counts down to the reset beside a 60-second request histogram that marks where the limit was crossed and unlocks Retry now at zero, and offline counts down to the next reconnect with backoff while listing the changes queued locally.

## Props

| Prop                 | Type                          | Default                          | Description                                                              |
| -------------------- | ----------------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `kind`               | `TarnScreenKind`              | `"not-found"`                    | `not-found`, `server-error`, `maintenance`, `rate-limited` or `offline`. |
| `path`               | `string`                      | `"/northwind-labs/ingest-wrker"` | The requested path (404).                                                |
| `suggestion`         | `string`                      | `"ingest-worker"`                | Closest existing slug; the action links to it (404).                     |
| `requestId`          | `string`                      | `"req_01JB7X4M2Q9TFA"`           | Footer request id.                                                       |
| `region`             | `string`                      | `"fra1"`                         | Footer region.                                                           |
| `timestamp`          | `string`                      | `"2026-10-27 14:06:52 UTC"`      | Footer time.                                                             |
| `incidentAgeSeconds` | `number`                      | `252`                            | Starting incident age; counts up (500).                                  |
| `retryAfterSeconds`  | `number`                      | `27`                             | Seconds to reset, from the `Retry-After` header; counts down (429).      |
| `reconnectInSeconds` | `number`                      | `8`                              | Seconds to the next reconnect attempt; doubles per failure (offline).    |
| `onRetry`            | `() => void \| Promise<void>` | none                             | Retry request (500, spins until settled) and Retry now (429).            |
| `onReconnect`        | `() => void`                  | none                             | Called when the browser is back online (offline).                        |
| `className`          | `string`                      | `""`                             | Extra classes for the `<section>`.                                       |

## Tokens

Reads `--iu-background` (page), `--iu-surface` (log panel), `--iu-border` (dashed rules and panel edge), `--iu-foreground` (status code, values, done steps, progress segments), `--iu-muted` (labels, corner ticks, pending steps), `--iu-accent` (the one action, the active step, the inserted letter in the slug diff, focus rings), `--iu-accent-foreground`, `--iu-radius` (capped at 8px), `--iu-font` and `--iu-density` (log padding). Failing and warning states use semantic red and amber, always next to a text label. Add tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react` (arrow, retry, loader, check and wifi-off icons). Timers are plain intervals that stop when the component unmounts. Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/tarn-status-screens` (or copy `component.tsx` to `components/iloveui/tarn-status-screens.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. In Next.js, render `kind="not-found"` from `app/not-found.tsx` and `kind="server-error"` from `app/error.tsx`, passing `reset` as `onRetry`.
4. For 429 responses, pass the `Retry-After` header as `retryAfterSeconds` and your refetch as `onRetry`; for maintenance, render it from your middleware while writes are paused.
5. Render `kind="offline"` when `navigator.onLine` is false and pass your sync function as `onReconnect`.
6. Replace the copy in `SCREENS` and the log panels with your own team, projects and incident data.

## Customization ideas

- Feed the 500 timeline from your incident tool so the steps tick as on-call updates them.
- Compute `suggestion` with a Levenshtein search over the user's projects and highlight every differing letter.
- Add a 401 kind that shows which token scope was missing and links to token settings.
- Drive the maintenance progress from a status endpoint every 30 seconds.
- Use `--iu-density` 0.8 for a tighter log on small screens.
