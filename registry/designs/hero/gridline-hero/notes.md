# Gridline hero

## Usage notes

- Use it as the first section of a landing page for a product that has a log, a timeline or a list at its core; the visual is the product, not an illustration.
- The headline and the action come first in reading order and on small screens, so the hero still makes sense with the log below the fold.
- The release log is a real `<table>` with a caption for screen readers; owner monograms are hidden from assistive tech and the full name is read instead. At narrow container widths the owner column is dropped.
- The in-flight build announces "is live" once through a polite live region. It plays once on mount, starts after a short delay and is instant under reduced motion.
- `--iu-density` sets the row height, so compact themes tighten the log without touching the message.

## Taste self-review

- One clear focal point: Yes. The headline is the largest element on a quiet grid, and the only moving, accent-colored thing on the page is the deploy in progress, which leads the eye from message to product.
- Spacing on the 4px scale: Yes. Every margin, gap and padding is a 4px multiple (12, 16, 24, 40, 56px); row padding scales from 12px with the density token.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like a release dashboard those teams ship: monospace figures, hairline rules, one restrained accent, a black primary button.
- Meets its category brief: Yes. One message in six words, one primary action, a visual that shows the product (its release log), and at 375px the message and action stand alone above the log.
- Distinct from every other design in its category: Yes. It is the catalog's only hero built on a visible Swiss grid with a working data table as its visual.
