# Waterfall trace hero

## Usage notes

- Use it as the first section of a landing page for an observability, API or infrastructure product. The visual is a working trace inspector, so the product explains itself before anyone reads the subline.
- Reading order is kicker, headline, subline, action, then the inspector; at 375px the message and action stand alone above it and the inspector narrows to name, bar and duration with the details panel below.
- The spans are a WAI-ARIA listbox with a roving tab stop: Arrow Up and Down move the selection, Home and End jump to the ends, and the details panel updates with each move. The Replay button has an accessible name, and the verdict is announced once through a polite live region.
- The sweep runs once when the inspector enters the viewport, pauses while it is offscreen and takes 2.4 seconds. Under reduced motion the finished trace renders immediately with the slowest span selected.
- Server-rendered markup shows the complete trace, so nothing is hidden before JavaScript loads. `--iu-density` sets the row height.

## Taste self-review

- One clear focal point: Yes. The headline leads, and the one accent bar in a field of neutral bars, the slowest span, is where the eye lands next.
- Spacing on the 4px scale: Yes. Paddings and gaps use 8, 12, 16, 20, 32 and 56px; rows scale from 8px with density, and the column offsets are 12px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like a real tracing tool: mono figures, dashed tick lines, a span tree, attributes and a concrete suggestion, with no decoration a real tool would not ship.
- Meets its category brief: Yes. Six words of message, one primary action, a visual that is the product working, and the message stands alone at 375px.
- Distinct from every other design in its category: Yes. The message spans the full width above a full-width inspector instead of sitting beside a table or editor, and its motion is a playhead sweep that ends on the answer.
