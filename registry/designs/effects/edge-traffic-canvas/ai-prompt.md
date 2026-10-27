# Edge traffic canvas

## Component

`EdgeTrafficCanvas` is a full-width section whose background is a `<canvas>` drawing sampled production traffic: a dot-matrix world map, one square per edge region sized by its share of traffic, and requests arcing from nearby clients to the region that answers them. Each arrival pulses a square ring; rate-limited requests are drawn in the error hue. A solid panel holds the message, one primary action and a Pause map button; a readout below shows requests per second, the blocked share and the four busiest regions with their p50, ticking once a second. The animation runs only while the section is on screen and the tab is visible; when paused or under reduced motion the canvas shows a frozen frame of requests mid-flight and the status reads Paused or Snapshot.

## Props

| Prop                | Type                        | Default                   | Description                                                                  |
| ------------------- | --------------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `brand`             | `string`                    | `"Ostra Edge"`            | Product name in the panel's mono label.                                      |
| `headline`          | `string`                    | Ten-regions headline      | The one message.                                                             |
| `subline`           | `string`                    | Sampling explanation      | Says what the dots are, so the visual is honest.                             |
| `ctaLabel`          | `string`                    | `"Open traffic explorer"` | Label of the only primary action.                                            |
| `ctaHref`           | `string`                    | `"#explorer"`             | Where the action goes.                                                       |
| `regions`           | `EdgeRegion[]`              | Ten regions               | `{ code, city, lon, lat, share, p50, labelSide? }`; `share` sums to about 1. |
| `requestsPerSecond` | `number`                    | `48214`                   | Global rate shown in the readout; region rates are `share` times this.       |
| `blockedRate`       | `number`                    | `0.018`                   | Share of requests blocked with 429; also the share of error-colored dots.    |
| `sampleEvery`       | `number`                    | `2000`                    | Requests per dot, stated in the legend.                                      |
| `onPausedChange`    | `(paused: boolean) => void` | none                      | Called when the visitor pauses or resumes the map.                           |
| `className`         | `string`                    | `""`                      | Extra classes for the `<section>`.                                           |

## Tokens

Reads `--iu-background` and `--iu-surface` (section and panels; panels step up to the surface in dark mode), `--iu-border` (readout rules), `--iu-foreground` (region markers, the map's sea dots at 18%), `--iu-muted` (land dots, labels, corner ticks), `--iu-accent` (served requests, arrival rings, the live dot, the primary button, focus rings), `--iu-accent-foreground`, `--iu-radius` (capped at 8px), `--iu-font` and `--iu-density` (panel and readout padding). The canvas resolves the colors from hidden probe elements once a second, so Theme Lab and dark mode re-skin it live. Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react` (arrow, pause and play icons). The map is plain Canvas 2D with `requestAnimationFrame`; no animation library and no map tiles. Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/edge-traffic-canvas` (or copy `component.tsx` to `components/iloveui/edge-traffic-canvas.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<EdgeTrafficCanvas />` as a landing or status section and pass your real `regions` (longitude, latitude, share and p50).
4. Feed `requestsPerSecond` and `blockedRate` from your metrics endpoint every few seconds; the canvas samples dots from the shares, so keep `sampleEvery` honest about the ratio.
5. Point `ctaHref` at your traffic or analytics page and use `onPausedChange` if you want to persist the visitor's choice.

## Customization ideas

- Swap blocked requests for cache misses and color them with the muted token to show cache efficiency.
- Draw one ring per deploy instead of per request to make it a live map of rollouts.
- Add a region filter: dim every region but the one under keyboard focus in the readout.
- Use it as a status page header with `requestsPerSecond` from your public metrics.
- Set `--iu-density` to 0.8 for a tighter readout inside a dashboard.
