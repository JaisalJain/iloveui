# Ondine OTP input

## Usage notes

- Use it for any one-time code: two-step sign-in, a new device, a payout or a change of bank details. It expects the code to be digits only.
- Six real `<input>`s inside a `<fieldset>` with a hidden legend, each labelled "Digit N of 6", `inputmode="numeric"` and `autocomplete="one-time-code"` on the first, so autofill from messages and password managers works.
- Mouse and touch: tap any box; the code fills from there. Paste or autofill anywhere fills the whole code from the first box. Keyboard: type to advance, Backspace clears and walks back, Delete clears in place, Left, Right, Home and End move between boxes.
- Screen readers: the status line describes the fieldset; the full code is announced digit by digit when complete, followed by Verifying, then Verified or the error message, all politely. Errors also set `aria-invalid` on every box.
- States: default, active (part-entered with the caret in the next box), loading (verifying, inputs read-only), success (joined rule and italic confirmation), error (boxes cleared, red hairlines, message) and disabled (lockout notice, inputs and resend off).
- Reduced motion: entry, verification and errors work the same; digits appear, hairlines change and the success rule shows instantly, and the caret stops blinking.
- At 375px the boxes narrow to 40px with a 6px gap; from 640px the code splits into two groups of three for easier reading.

## Taste self-review

- One clear focal point: Yes. The six serif numerals on their hairlines; everything else is small, tracked and muted, and the accent appears only where the next digit goes.
- Spacing on the 4px scale: Yes. 6px outer frame, 20 to 40px panel padding scaled by density, 40px above the code, 24px around the status line and footer, 16px group gap.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is the verification step a premium bank or members' service would ship: precise input handling, autofill, honest errors and a resend limit.
- Meets its category brief: Yes. Motion on transform and opacity only with springs for digit entry and a spring nudge on error, interruptible because each keystroke retargets; mouse, touch and full keyboard; idle, active, loading, success, error and disabled states; a polite live region announcing the code; instant changes under reduced motion; optional vibration; onComplete, onChange and onResend with typed length, labels and durations.
- Distinct from every other design in its category: Yes. It is the category's only text-entry micro-interaction; the slide, hold, swipe, reorder and morphing-button designs are all pointer gestures on a single control or list.
