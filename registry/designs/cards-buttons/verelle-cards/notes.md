# Verelle cards

## Usage notes

- Use the set on a luxury product page, a private-client portal or a high-consideration checkout step, where one object is the subject and service is the supporting story. The product card leads; the feature and advisor cards stack beside it from 768px of container width and below it on phones.
- Reserve: a native `<button>` whose three labels (Reserve, Reserving, Reserved) share one grid cell, so the width never changes. While busy it is `aria-disabled`, so repeat presses do nothing, and the note under it is a polite live region ("Confirming your allocation", then "Held for you for 48 hours"). Success returns to idle after 4 seconds when uncontrolled.
- Keyboard: three buttons in reading order (Reserve, Engraving styles, Book). Focus is a 2px accent outline 3px outside each control. The watch and caseback drawings are decorative and hidden from screen readers; the section has a hidden heading naming the house and product.
- States: `forceState` renders hover (inner frame on each card, watch lifted 2%, link arrow opens, buttons tint), focus (rings) and active (98% press) statically. `disabled` shows "Allocation closed" as an outline pill and "Appointments full" as a dashed pill, with waiting-list copy. Loading draws the hairline to 86%; success closes it.
- Motion is slow and quiet, as the family asks: 300 to 500ms, opacity and scale of 2% or less, and the stroke trace. Reduced motion shows the final stroke and label at once.

## Taste self-review

- One clear focal point: Yes. The watch on its stage and the serif name under it; the side cards are quieter and smaller, and the accent appears only as fine lines.
- Spacing on the 4px scale: Yes. Card padding 24 and 32px, 16px gaps scaled by density, 8px inner frame inset, 12, 24 and 32px vertical rhythm in the product card.
- Belongs in a Linear, Stripe or Vercel product: Yes. Restraint with full state coverage: a width-stable async button, honest disabled copy and keyboard-visible focus on every control.
- Meets its category brief: Yes. Hover, focus, active, disabled, loading and success all render on demand; the loading button keeps its width; there are no icon-only buttons, and every icon is decorative beside a text label.
- Distinct from every other design in its category: Yes. Gumdrop buttons is a playful tactile button tray with a streak card; this is a luxury card set with drawn products, serif type and a hairline-trace loading button.
