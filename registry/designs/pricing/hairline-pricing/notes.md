# Hairline pricing

## Usage notes

- Use it as the pricing section of a per-seat SaaS product with three self-serve plans, where the comparison is short enough to sit under the plans on one page.
- It expects monthly and yearly per-seat prices for each plan, a one-line summary, and comparison rows keyed by plan id. Exactly one plan is highlighted.
- The grid is the design: from 768px the billing switch holds the left four columns and the plans the right eight, and the comparison table reuses the same columns (a third for labels, two ninths per plan), so each value sits exactly under its plan and the highlighted column's tint runs from the plan into the table without a break. On phones the plans stack and the table keeps three narrow value columns with short plan names.
- The billing switch is a fieldset of two native radios: Tab reaches the checked option and the arrow keys switch. Each price has a spoken unit and billing period, and the line under it states the yearly total and the dollar saving, so the saving is stated per plan as well as in the switch (−17%).
- Checkout buttons are native buttons. While checkout opens the button keeps its width, reports `aria-disabled` and fills a hairline along its lower edge; a polite live region announces it. The error row is an alert with Try again. On success the button becomes a confirmation that receives focus.
- The comparison is a real table with a caption, column headers and row headers; checks and dashes are read as "Included" and "Not included".
- States: default, loading, error and success. Motion runs only on interaction (150 to 200ms ease-out, no springs) and is instant under reduced motion. `--iu-density` sets the comparison row height.

## Taste self-review

- One clear focal point: Yes. The three oversized prices on one baseline, and among them the highlighted column, the only tinted area and the only accent fill on the page.
- Spacing on the 4px scale: Yes. Gutters, paddings and gaps are 4px multiples (8, 12, 20, 24, 32, 40, 56px); comparison rows scale from 12px with the density token.
- Belongs in a Linear, Stripe or Vercel product: Yes. Hairline rules, flush-left type, a monochrome switch and one restrained accent read like a pricing page those teams publish.
- Meets its category brief: Yes. One highlighted plan; comparable rows aligned to the plan columns; a monthly/yearly toggle with the saving stated in percent and in dollars per plan; a tax and refund line under the table; loading, error and success states for checkout.
- Distinct from every other design in its category: Yes. Slab pricing is loud neo-brutalist slabs with rolling digits; this is a quiet Swiss grid where the plans and the comparison share one column system and numbers cross-fade.
