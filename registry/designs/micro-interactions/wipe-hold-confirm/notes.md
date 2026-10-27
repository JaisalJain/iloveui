# Wipe hold to confirm

## Usage notes

- Use it for one irreversible action where a click is too easy and a modal is too slow: wiping a device, deleting a project, purging data. The hold is the confirmation; the consequences list says exactly what will happen.
- Pointer and touch: pointer capture keeps the hold alive if the finger slides, the context menu and touch callout are suppressed, and `touch-none` stops the page scrolling under the press. Releasing early drains the fill with a stiff spring seeded with the fill's speed; pressing again mid-drain resumes from the current fill.
- Keyboard: holding Space or Enter fills it exactly like a pointer (key repeat is ignored), releasing the key cancels, Escape cancels, and moving focus away cancels. Assistive tech that sends a single click starts a full timed hold that Escape stops, and the live region says so.
- States: idle, active (mid-hold, `forceState="active"`), disabled (dashed outline, lock, admin reason), loading, error (fill resets, "Hold to retry" with the reason) and success (the device sticker flips to Erase pending). The message line under the control keeps its height so nothing jumps.
- Reduced motion: the fill still tracks the hold because it is the function, but the drain and press are instant. A fresh success calls `navigator.vibrate([12, 40, 12])` where supported.
- Responsive: the device stats sit in four columns from 640px and a 2 by 2 grid below; the control is full width at every size.

## Taste self-review

- One clear focal point: Yes. The slab button is the largest control and the only thing that moves; the accent fill slides in under it as the hold progresses.
- Spacing on the 4px scale: Yes. 20 and 28px panel padding scaled by density, 24px and 28px between groups, a 64px control, 4px press travel matching the 4px shadow.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is the danger zone of a device-management console, with serials in mono, honest consequences and a confirmation you cannot trigger by accident.
- Meets its category brief: Yes. motion/react drives the fill and a velocity-seeded spring drain, an early release snaps back, a new press interrupts the drain, mouse, touch and held Space or Enter all work, idle/active/disabled/loading/error/success are all previewable, an aria-live region announces each step, reduced motion keeps the function, vibrate is optional, and `onChange`, `onComplete`, `onCancel`, typed labels, hold duration and spring are exposed.
- Distinct from every other design in its category: Yes. It is the category's only press-and-hold control; the others are a horizontal drag-to-threshold slider and a morphing submit button.
