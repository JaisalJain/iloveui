# Redaction reveal headline

## Usage notes

- Use it directly under a hero to land two or three promises that matter more than features: what a product never collects, never stores or never charges for. The redacted phrases are the promises.
- The effect is purposeful pacing: each phrase is held under a bar until it reaches the reading line, then lifts in four hard steps and drops onto its accent underline, so the eye lands on the promise at the moment it is read. It plays once; bars never return when scrolling back up, and phrases already scrolled past on load are never covered.
- The server markup is the finished state, so the statement is fully readable without JavaScript and to search engines. Bars are `aria-hidden` and screen readers always read the plain sentence. Under `prefers-reduced-motion` no bar is drawn; the underlines are simply there.
- Performance: one `IntersectionObserver` and CSS transitions on `transform` only; no scroll listeners and no animation library. Timers are cleared on unmount.
- Responsive: the statement scales with a clamp from 40px to 96px; the sticker sits above the statement on small screens and floats top-right from 1024px. Receipts stack on phones and sit in a row of three from 640px. `--iu-density` sets receipt padding.

## Taste self-review

- One clear focal point: Yes. The 96px statement owns the page and the accent underlines point at exactly three phrases; everything else is small mono support.
- Spacing on the 4px scale: Yes. Gaps and paddings are 8, 12, 16, 24, 40, 56 and 80px; offset shadows are 3, 4 and 6px on the 2px outline grid, and receipt padding scales with the density token.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like the privacy page of a confident developer tool: one sentence, receipts with real numbers and the source one click away.
- Meets its category brief: Yes. The motion has a job (paces reading onto the promises), animates `transform` only behind one observer, plays once, has a complete reduced-motion and no-JavaScript fallback, and uses none of the 7.1 patterns: no gradients, blobs, blur or loops.
- Distinct from every other design in its category: Yes. It is the catalog's only text effect driven by reading position, and the only one built on redaction bars rather than counting, canvas or pointer input.
