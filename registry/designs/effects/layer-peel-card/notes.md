# Layer peel card

## Usage notes

- Use it on a feature or docs page for any product whose value is composition: design-to-code tools, component libraries, email or map builders. The effect has a job: it shows that the screen is made of separable parts and names each one.
- Interaction: mouse movement over the stage tilts the stack up to 12 degrees with a spring; touch and pen never tilt, so scrolling is never hijacked. Pull it apart is a toggle button with `aria-pressed`, and a polite live region says "Layers pulled apart" or "Layers stacked". The layer list is a group of toggle buttons; Arrow Up and Down, Home and End move between them, and focusing a row lifts that layer, so keyboard users get the same explanation as pointer users.
- Motion: transform and opacity only, with bouncy springs (stiffness 400, damping 18) per the playful family; everything is interruptible. Under reduced motion there is no tilt, transitions are instant and the exploded view is a flat diagonal fan with no 3D.
- The resting state is the finished screen, rendered on the server; the dashed sheets and their stickers are added only when pulled apart.
- Responsive: the text and list come first on phones with the stage below it at 290px wide; from 1024px they sit side by side. Export names hide below 640px. `--iu-density` sets list row padding.

## Taste self-review

- One clear focal point: Yes. The stacked app screen; the list and buttons are there to drive it.
- Spacing on the 4px scale: Yes. Gaps 8, 12, 20, 24, 32, 48px; layers step 14px at rest and 64px pulled apart; row padding scales from 14 and 10px with the density token.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is the kind of explainer a design-to-code product would put on its features page: playful, but every move teaches the model.
- Meets its category brief: Yes. The effect explains depth and composition, animates transform and opacity only, and has a complete reduced-motion fallback with none of the 7.1 patterns: no gradients, blobs, blur or loops.
- Distinct from every other design in its category: Yes. It is the only 3D and the only pointer-driven effect; the others are a reading-position text reveal and a data canvas.
