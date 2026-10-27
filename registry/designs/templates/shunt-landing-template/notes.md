# Shunt landing page

## Usage notes

- A complete marketing page for one invented product, Shunt, a background job queue: sticky header with a designed mobile menu, hero with the live queue board, four product cells, a guarantee statement, evidence-based customer proof, pricing with checkout states, FAQ, a sign-up call to action and a footer with real link structure. Every section speaks for the same product and the same numbers.
- Adapted from the neo-brutalist catalog, rebranded and rewritten for Shunt, and copied into this one file:
  - Header mobile menu: the native modal sheet that drops from the top in `dashboards/bigtop-analytics-shell` (focus lands on the first link, Escape, the close button, the backdrop or a link close it, focus returns to the menu button).
  - Hero queue board: the four-block stage rail and stamped stickers of `tables/gristmill-order-board`, rebuilt as a read-only job board with a Retry action.
  - Product cell A (find any job): the scope sticker, grouped results and hard-shadowed active row of `navigation/boxcar-command-palette`.
  - Product cell C (purge on purpose): the hold-to-confirm fill of `micro-interactions/wipe-hold-confirm`, with the same pointer, Space/Enter, Escape and single-click rules.
  - Product cell D (throughput): the chunky ink bars of `dashboards/bigtop-analytics-shell`, here split into first-try and retried jobs.
  - Guarantee: the scroll-paced redaction bars and numbered receipts of `effects/redaction-reveal-headline`.
  - Pricing: the slabs, billing switch, rolling digits, stepped loading blocks, error box and confirmation of `pricing/slab-pricing` (comparison table dropped; the terms line stays).
  - New connective sections: header, hero copy and enqueue snippet, retry backoff cell (B), customer receipts, FAQ, sign-up block and footer.
- Hero: the first healthy running job finishes once, 1.4 seconds after the board scrolls into view, and the Done today counter ticks up. The failed job has a Retry button: pressing it stamps the job back to Queued, then Claimed, Running and Done, one rail block at a time, and a polite live region reports the result. Under reduced motion nothing runs on its own and Retry jumps straight to Done.
- Keyboard and screen readers: every control is a native link, button, radio, details or form field with a visible accent focus ring. Mini product visuals are hidden from assistive tech and described by a figure caption instead. The billing switch is a fieldset of two radios, and price changes are announced. Checkout and sign-up progress and results are announced, and focus moves to the confirmation heading after a successful checkout and to the success message after sign-up.
- States: `checkoutStatus` and `signupStatus` take idle, loading, error or success, or leave them unset and return promises from `onCheckout` and `onSignup`. Loading keeps button widths with stepping blocks; the checkout error is an alert box with Retry checkout; the sign-up form validates the address inline and shows a bounce error; success replaces the plan's price with an order confirmation and the form with a check-your-inbox message.
- Responsive: one column at 375px with the board rows folding to two lines and the enqueue snippet left out so the board follows the action, the mobile menu below 1024px, three pricing slabs on subgrid rows from 768px, and the 12-column layout from 1024px. Container queries lay out the board, so it works in any column width.
- Performance: one IntersectionObserver per effect, CSS transitions on transform for the redaction bars and rolling digits, motion only for the rail fills, stickers and hold fill. The loading blocks are the only loop and pause offscreen.
- `--iu-density` scales board rows, feature cells, receipts, testimonials and FAQ rows; `--iu-radius` is capped at 4px (2px for stickers), as the family asks.

## Taste self-review

- One clear focal point: Yes. The oversized headline leads straight into the queue board, where the only accent-filled rail block is the running job and the only accent button is Retry on the failed one.
- Spacing on the 4px scale: Yes. Gaps and paddings are 4px multiples (4, 8, 12, 16, 20, 24, 32, 40, 56, 80, 112px), shadows sit at 3, 4, 6, 8 and 12px, and density scales the row paddings.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like the launch page of a serious developer tool: real job names and IDs, honest backoff and throughput numbers, a code snippet, a pricing page with tax and refund terms.
- Meets its category brief: Yes. It is a complete page assembled from six neo-brutalist catalog designs plus new connective sections (listed above), all rebranded to one product and held to one family: 2px ink outlines, hard offset shadows, square monograms, stickers, mono metadata and 100ms linear motion.
- Distinct from every other design in its category: Yes. It is the first full-page template in the catalog and the only one built around a product you can operate from the hero.
