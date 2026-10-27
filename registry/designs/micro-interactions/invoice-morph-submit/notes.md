# Invoice morph submit

## Usage notes

- Use it wherever one form ends in one async action whose result the user waits for: sending an invoice, a quote, an export. The button is the point; the form around it shows it in a believable context.
- The button never changes size: all four labels are stacked invisibly in one grid cell and the visible one cross-fades over them, so nothing around it jumps.
- Keyboard and screen readers: it is a native submit button, so Enter in any field or Space and Enter on the button submit. During sending it is `aria-disabled` (not `disabled`), so focus stays on it. Error and success text are linked with `aria-describedby`, and a polite live region announces sending, sent and the error. An invalid email is reported inline, focused and described.
- States: idle, active (pressed, `forceState="active"`), disabled (no recipient), loading, error (outlined Try again plus the reason) and success. `minLoadingMs` keeps loading visible for at least 600ms.
- Reduced motion: the label swap becomes a 120ms fade with no lift, the hairline jumps to its value, the dots stop stepping and the check appears drawn. A fresh success calls `navigator.vibrate(10)` where supported.
- Responsive: fields stack below 640px and the button spans the column; from 640px fields sit 7/5/12 on a 12-column grid.

## Taste self-review

- One clear focal point: Yes. The button is the only solid block; the accent appears once, as the hairline that tracks the send.
- Spacing on the 4px scale: Yes. 12px rules, 20 and 32px side padding scaled by density, 24px and 32px between groups, a 48px button.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like Stripe's invoice composer: an oversized tabular amount, numbered fields, one honest progress line and no decoration.
- Meets its category brief: Yes. A motion/react spring (critically damped, 400/40) drives the label morph and is interruptible because each state swap replaces the last; the gesture is a press, which works with mouse, touch and keyboard; idle, active, loading, success, error and disabled are all previewable; it announces through aria-live, falls back to short fades under reduced motion, vibrates optionally on success and exposes `onChange`, `onSubmit`, `onComplete`, typed labels and durations.
- Distinct from every other design in its category: Yes. It is the category's only morphing submit button; the others are a drag-to-threshold slider and a press-and-hold fill.
