# Typeset hero

## Usage notes

- Use it as the first section of a landing page for a writing, newsletter or publishing product. The visual is the product: one manuscript shown in each output it can produce.
- The headline, subline and action come first in reading order and on small screens, so at 375px the message stands alone above the editor window.
- The format switcher is a WAI-ARIA tablist with automatic activation: Arrow Left and Right move between formats, Home and End jump to the ends, and the tabpanel is labelled by the selected tab. The article inside is presentational text, so screen readers read it as a sample rather than a second page of content.
- Changing formats fades the old page out and the new one in from 8px below (320ms) while the accent underline slides to the new tab. Under reduced motion both are instant.
- Print sets two justified, hyphenated columns with a column rule once the window is wide enough and collapses to one column in narrow containers; `--iu-density` sets the window bar height.

## Taste self-review

- One clear focal point: Yes. The large serif headline leads, and the only accent marks in the window, the drop cap and the active tab, pull the eye straight to the typeset page.
- Spacing on the 4px scale: Yes. Gaps, paddings and rules sit on 4px multiples (12, 16, 24, 32, 48, 56px); the window bar scales from 10px with density.
- Belongs in a Linear, Stripe or Vercel product: Yes. It has the restraint of a serious editorial tool: hairline frames, a double-ruled masthead, one accent and real typographic detail instead of ornament.
- Meets its category brief: Yes. The message is six words, there is one primary action, the visual is the editor and its three outputs rather than an illustration, and the message reads on its own at 375px.
- Distinct from every other design in its category: Yes. It is the catalog's only serif, magazine-set hero, and its interaction is a format switch that re-lays out one article, unlike the release log ticking in the grid hero.
