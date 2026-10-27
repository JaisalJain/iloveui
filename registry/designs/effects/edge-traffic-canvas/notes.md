# Edge traffic canvas

## Usage notes

- Use it as the background of a landing or status section for infrastructure products: CDNs, edge functions, API gateways, anything where "where requests go" is the product. The canvas shows real structure (regions, their share, sampled arrivals), not decoration.
- Performance: the grid, land and labels are drawn once into an offscreen layer and only redrawn on resize or re-theme; each frame draws the layer plus at most 120 requests. The `requestAnimationFrame` loop stops when the section leaves the viewport (`IntersectionObserver`), when the tab is hidden (`visibilitychange`) and when paused, and never starts under `prefers-reduced-motion`.
- Fallback: under reduced motion, or while paused, the canvas shows a deterministic frozen frame with 64 requests mid-flight, the status reads Snapshot or Paused and the readout stops ticking. Without JavaScript the message, action and readout still render.
- Accessibility: the canvas is `aria-hidden`; the map area has `role="img"` with a label that names the busiest regions and their share. The Pause map button meets WCAG 2.2.2 for content that moves longer than five seconds. Blocked requests are paired with the "Blocked 429" legend and a readout figure, never color alone.
- Responsive: on phones the panel comes first and the map sits below it at 220px; from 1024px the map fills the seven columns beside the panel. The readout is two, three or six columns.

## Taste self-review

- One clear focal point: Yes. The map with requests landing at regions; the headline panel and readout frame it in quiet mono.
- Spacing on the 4px scale: Yes. Panel padding 24px (density-scaled), gaps 8, 12, 24px, grid dots every 24px and land dots every 8px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like the traffic view of an edge platform: honest sampling ratio, p50 per region, a pause control, no ornament.
- Meets its category brief: Yes. Canvas with `requestAnimationFrame` paused offscreen and in hidden tabs, a complete static fallback under reduced motion, and none of the 7.1 patterns: no gradients, blobs, blur or decorative loops; the motion is the data.
- Distinct from every other design in its category: Yes. It is the only canvas piece and the only one driven by data rather than reading position or pointer input.
