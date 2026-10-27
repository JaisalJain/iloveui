# Private office hero

## Usage notes

- Use it as the first section for a premium product where the thing itself carries the sale: a private bank, a wealth app, a travel house or a luxury goods companion app.
- The message is first in reading order and on small screens, so at 375px the headline, subline and action stand alone before the statement. On wide screens the statement leads visually on the left.
- The period selector is a WAI-ARIA radiogroup: Arrow keys move and select, the group has one tab stop, and each change is announced once through a polite live region ("Up €4,906,112, 11.3 percent this year").
- Changing the period rolls the gain (500ms), redraws the line from the left (600ms) and slides the accent mark to the new end point. Under reduced motion all three are instant. Nothing animates on load.
- `--iu-density` sets the spacing of the allocation list.

## Taste self-review

- One clear focal point: Yes. The large serif net-worth figure in a framed statement, set against generous space, with the headline as its counterweight.
- Spacing on the 4px scale: Yes. Paddings and gaps use 8, 12, 16, 20, 24, 28, 40 and 64px; the allocation rows scale from 8px with density.
- Belongs in a Linear, Stripe or Vercel product: Yes. It has the precision of a well-made financial product: tabular figures, hairlines, one fine line chart and a single accent mark.
- Meets its category brief: Yes. Three words of message, one primary action, the product (the client statement) as the visual, and the message reads alone at 375px.
- Distinct from every other design in its category: Yes. It is the only hero with the product on the left as a framed, inverse object, and its interaction is a period choice that rolls a figure and redraws one line.
