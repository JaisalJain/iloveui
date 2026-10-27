# Orsolo membership

## Usage notes

- Use it for a premium membership or retainer with three tiers, an annual price and a short list of benefits: a concierge, a club, a private service. It expects one-year prices, a two-year discount, and benefit values of one or two words.
- The tiers are a fieldset of native radios: Tab reaches the selected tier, the arrow keys move between tiers, and each tier reads its name, price per year and summary. The decorative numeral, the Select pill and the diamond are hidden from assistive tech. The term switch is a second radio fieldset.
- From 768px the tiers sit in three columns that share their grid with the comparison table below, and a single double frame moves between columns (450ms, no bounce), so the chosen tier and its benefits read as one object; unselected values recede to the muted color. On phones the tiers become compact rows with the price on the right, the selected row takes the frame and the diamond, and the comparison keeps three narrow columns headed by the numerals.
- The comparison is a real table with a caption, row headers and column headers (visually hidden on wide screens, where the tiers above label the columns); dashes are read as "Not included".
- The selection is restated above the action with the term total, and the line under it states the saving on the two-year term. The terms line states VAT and the refund window.
- States: default, loading (a thin line draws inside the button, which keeps its width and reports `aria-disabled`), error (a quiet alert note and Try again) and success (a framed member card; focus moves to its heading). Motion is slow and graceful (300 to 500ms, scale changes of 1.5% or less) and instant under reduced motion. `--iu-density` sets the comparison row height.

## Taste self-review

- One clear focal point: Yes. The framed column: the recommended tier is selected first, so the eye goes to its serif price and follows the frame down through its benefits.
- Spacing on the 4px scale: Yes. Section padding 80 and 112px, column padding 24 and 40px, gaps 8, 16, 32 and 56px; comparison rows scale from 16px with the density token.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is the restrained, typographic selection page a premium service built on those platforms would publish: no cards, fine rules, one accent mark.
- Meets its category brief: Yes. One highlighted tier (the members' choice, selected and framed), comparable rows aligned to the tier columns, a term switch with the saving stated in percent and in currency, a VAT and refund line, and loading, error and success states for the request.
- Distinct from every other design in its category: Yes. Slab pricing is loud slabs, Hairline pricing a Swiss grid with buttons per plan, Cushion checkout a payment form; this is a centered serif selection where a radio group moves a single frame across columns and ends in a member card.
