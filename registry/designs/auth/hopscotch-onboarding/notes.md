# Hopscotch onboarding

## Usage notes

- Use it right after the first visit to a product with workspaces: it creates the account, names the workspace, invites people and sets a first board in one guided card.
- The progress row is a `nav` with an ordered list; the current tile has `aria-current="step"`, finished tiles are buttons that jump back, and future tiles are disabled. When the step changes, focus moves to the new step heading so screen readers announce it.
- Fields validate on blur and on Continue; errors are linked with `aria-describedby`, and the first invalid field receives focus. The password toggle has `aria-pressed` and a changing label.
- Team type and template are native radio groups (arrow keys work), the digest is a native checkbox with `role="switch"`, and invite chips each have a labelled remove button. Enter or comma adds an invite; duplicates and malformed emails are explained inline.
- Loading keeps the button width with three bouncing dots and a hidden "Setting up" label; errors keep every answer. All motion is instant under reduced motion.
- At narrow widths the tile labels collapse into one "Step 2 of 4 · Workspace" line and the template cards stack.

## Taste self-review

- One clear focal point: Yes. The accent token on the progress path is the only saturated object; it moves only when you move, so the eye always knows where you are.
- Spacing on the 4px scale: Yes. Paddings and gaps are 4px multiples (8, 12, 16, 20, 24, 32px); step padding and field gaps scale with the density token.
- Belongs in a Linear, Stripe or Vercel product: Yes. Under the outlines and bounce it is a disciplined onboarding: one primary action per step, honest copy, every answer editable later.
- Meets its category brief: Yes. Google, GitHub and email sign-up on step one, inline validation on every field and invite, a password visibility toggle, loading dots and an error alert on finish, and progress shown three ways (tiles, sticker, step text).
- Distinct from every other design in its category: Yes. It is the category's only playful, card-based multi-step flow with a hopping progress token; the others are a single-panel sign-in, a two-factor setup and an editorial questionnaire.
