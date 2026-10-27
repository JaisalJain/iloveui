# Slab pricing

## Usage notes

- Use it as the pricing section of a developer product billed by volume (events, requests, minutes) with three self-serve tiers, when the comparison and the checkout belong on the same page.
- It expects per-month prices for both billing periods in whole currency units, a quota and overage line per plan, a few highlights per plan and comparison rows keyed by plan id. Exactly one plan is highlighted.
- The billing switch is a fieldset of two native radios: Tab reaches the checked option, the arrow keys switch, and the Yearly option is read with its saving. The rolling digits are hidden from assistive tech; each price has a full spoken sentence ("$63 per month, billed yearly at $756"), and a polite live region announces the new billing period.
- Plan buttons are native buttons. While checkout opens the button keeps focus, reports `aria-disabled` and stays pressed into its shadow with stepping blocks; the progress is announced. The error box is an alert that also describes the Retry checkout button. On success the slab becomes a confirmation and focus moves to its heading.
- The comparison is a real table with column, row and row-group headers and a sticky plan row; set `--slab-sticky-top` under a fixed site header. Below 768px it keeps every row comparable: a sticky strip of plan columns (name and price, accent tick on the highlighted plan) sits over rows that put each label above its values in the same three columns, and each value is read with its plan name ("Events per month: Starter: 250K, Team: 2M").
- Slabs stack on phones and sit in three columns from 768px on subgrid rows, so headers, prices, quotas, lists and buttons line up across plans whatever their text length. Labels that would crowd 768px columns drop their icons there.
- States: default, loading (button held in its shadow, width kept), error (inline box with a retry) and success (confirmation slab with the order summary). Motion runs only on interaction, is instant under reduced motion, and the loading blocks, the one loop, pause offscreen.
- `--iu-density` scales the band padding, the table and phone comparison row heights and the terms cells.
- Icons use a 2.5 stroke (3 for checks) so they hold their own next to the 800-weight labels of this family.

## Taste self-review

- One clear focal point: Yes. The Team slab is the only accent band, the deepest shadow and the only accent button on the page, and its column carries the same accent strip in the table; the oversized price numerals are the second level.
- Spacing on the 4px scale: Yes. Every margin, padding and gap is a 4px multiple from 4 to 96px, and band and row paddings scale from 20 and 12px with the density token; the only smaller values are the 2px rules and 2px hover lifts, plus em-based nudges that seat the currency symbol and /mo on the numerals. Hard shadows step 4, 6, 8 and 12px, which is also how far each element travels when pressed.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is a real usage-billing page with honest numbers (quotas, overage, tax, renewal dates), tabular figures and full checkout states, set loud but disciplined: one accent, one type family plus mono, and a grid you can see.
- Meets its category brief: Yes. One highlighted plan (Team); comparable rows in the table, in the phone comparison and in the per-plan lists; a monthly/yearly switch with the saving stated on the sticker and in each slab ("save $192"); a clear tax and refund strip (currency, tax at checkout, cancellation, 14-day refund); error (inline box with retry) and success (confirmation with order summary) states for checkout.
- Distinct from every other design in its category: Yes. It is the catalog's neo-brutalist pricing section: thick outlined slabs on hard shadows, a sticker on a chunky switch, prices that roll digit by digit while the slabs stamp, and a checkout that resolves inside the slab itself.
