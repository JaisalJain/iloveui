# Vaultline two-factor setup

## Usage notes

- Use it for sign-up in tools that require two-factor from the first session: secrets managers, infrastructure consoles, payment dashboards. Existing users can enter at the scan step.
- The code field is one native input (`inputMode="numeric"`, `autoComplete="one-time-code"`) layered over six visual cells, so typing, deleting, pasting and SMS or password-manager autofill all work; the cells are hidden from assistive tech and the input is labelled "One-time code". The current cell shows the focus ring.
- The countdown is a real 30-second window that pauses offscreen and is described to the input; the last five seconds turn the ticks to the accent. Under reduced motion only the fade and lock bounce are removed; the numbers still update.
- Errors carry a code (`E_TOTP_MISMATCH`) and plain copy in an alert; account errors are inline on each field. The session log is a polite live region, so each completed step is announced once.
- Finish stays disabled until the acknowledgement is checked. Copy and download confirm through a label change and a live region.
- Above roughly 768px of container width the log sits beside the steps; below it, it moves under them. Codes go to one column on narrow screens.

## Taste self-review

- One clear focal point: Yes. Each step has one bounded object in corner ticks or cells (the QR, the code field, the codes file), and the accent marks only the current step and what to do next.
- Spacing on the 4px scale: Yes. Gaps and paddings are 4px multiples (4, 8, 12, 16, 24, 32px); step padding and form gaps scale with the density token.
- Belongs in a Linear, Stripe or Vercel product: Yes. Mono labels, dashed dividers, an audit log with timestamps and error codes read like the security settings of a serious developer platform.
- Meets its category brief: Yes. GitHub, Google and email sign-up, inline validation, a password visibility toggle, loading and error states on account creation and verification, and progress shown as a four-segment stepper plus setup 2/4.
- Distinct from every other design in its category: Yes. It is the category's only two-factor flow, with a drawn QR, an OTP cell field, a code-window countdown and a session log; the others are a grid sign-in, a playful onboarding and an editorial questionnaire.
