# Ruled sign-in

## Usage notes

- Use it as the whole sign-in and sign-up page of a B2B product. Both modes live in one panel; tabs follow the WAI-ARIA tabs pattern (Left and Right switch, Home and End jump) and the panel is labelled by the active tab.
- Fields validate on blur and again on submit; the first invalid field receives focus, errors are linked with `aria-describedby` and marked `aria-invalid`, and a valid email shows a quiet check.
- The password toggle is a real button with `aria-pressed` and a changing label. In sign-up mode the ruler and rule list are linked to the password field, the strength readout is a polite live region, and each rule reads "met" or "not met yet".
- Loading disables the whole fieldset and the tabs; the button keeps its width and announces "Signing in". Errors render in an alert above the form; success replaces the form with a status panel.
- At 375px the trust facts are dropped and the panel takes the full width under the headline; at 1440px the grid splits 5 and 6 columns with one empty column between.

## Taste self-review

- One clear focal point: Yes. The panel is the only bounded object on the page, and inside it the ruler is the one element that changes as you type, carrying the eye from password to button.
- Spacing on the 4px scale: Yes. Gaps and paddings are 4px multiples (8, 12, 16, 20, 24, 32, 40px) and field spacing and panel padding scale from 20, 24 and 32px with the density token.
- Belongs in a Linear, Stripe or Vercel product: Yes. Monochrome type on hairline rules, a black primary button, one accent mark and precise mono readouts read like the sign-in of a serious developer tool.
- Meets its category brief: Yes. Email plus Google and GitHub sign-in, inline validation on every field, a password visibility toggle, a loading button and an error banner, and a success panel; the single-step flow shows its position in the crumb (01, 02, 03 / Verify email).
- Distinct from every other design in its category: Yes. It is the category's only grid-led, single-panel sign-in with a tick ruler for password strength; the others are multi-step onboarding, two-factor setup and a questionnaire.
