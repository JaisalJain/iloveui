# Tarn status screens

## Usage notes

- Use it for full-page status in any developer product: missing routes, server errors, maintenance windows, rate limits and offline clients. Every kind keeps the same frame, so they read as one family and the header status link is always one tab away.
- One action per screen: open the closest project (404), retry the request (500), follow the status page (maintenance), retry once the limit resets (429) and reconnect now (offline).
- Copy is honest and specific: it says whose fault it is, whether anything was applied or lost, what the limit is and who caused it, and when things resume. The request id, region and time in the footer give support something to search.
- Live parts are real counters, not decoration: the incident age counts up, the rate-limit reset and next reconnect count down once a second, the 429 button stays `aria-disabled` until zero, and offline listens for the browser's `online` event. A polite live region announces retries, the reset and reconnection. Spinners stop under reduced motion; no other motion is used.
- The status code is decorative (`aria-hidden`); the label above it and the `h1` carry the meaning. Status colors are always paired with text.
- Responsive: the message comes first and the log panel stacks below it on phones; from 1024px they sit side by side. The section fills the viewport height.

## Taste self-review

- One clear focal point: Yes. The large mono status code leads to the title and the single accent action; the log is supporting evidence.
- Spacing on the 4px scale: Yes. Gaps 4, 8, 12, 16, 24, 32, 40px; panel padding 16px scaled by the density token; corner ticks 12px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is how a serious platform explains failure: request ids, Retry-After, an incident timeline and no cute filler.
- Meets its category brief: Yes. One clear next action per screen, honest copy, and every visual (code ticks, slug diff, progress segments, request histogram, logo) drawn with CSS and inline SVG.
- Distinct from every other design in its category: Yes. It is the only full-page, dark technical set in the category and the only one with live counters; the other set is a playful illustrated card for in-app list states.
