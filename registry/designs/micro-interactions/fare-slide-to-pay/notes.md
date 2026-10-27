# Fare slide to pay

## Usage notes

- Use it for a deliberate payment moment where an accidental tap would be costly: tickets, rides, top-ups. It expects fare lines, a saved payment method and an `onComplete` that returns the payment promise.
- Pointer and touch: the thumb follows the finger directly (`touch-none` stops the page from scrolling under it). The release is velocity-aware: a quick flick that would carry past the line pays; a slow release short of it springs home with the release velocity, and grabbing the thumb mid-spring takes over at once.
- Keyboard: the thumb is a `role="slider"` with a percentage value. Arrow keys drag it in 10% steps, Enter, Space or End pays, Home or Escape returns it, and moving focus away returns it too. The hint under the track says so.
- Screen readers hear the slider's label ("Slide to pay €40.90") and value, and a polite live region announces loading, the payment result with its booking reference, or the decline.
- States: idle, active (mid-drag, `forceState="active"`), disabled (seat not chosen), loading, error (thumb returns and the label invites a retry) and success. The line under the track has a fixed height, so no state shifts the layout. A fresh success calls `navigator.vibrate(12)` where supported.
- Reduced motion: dragging still works; snap-back and completion jump straight to their end and labels cross-fade in 150ms.
- Responsive: the card fills its column up to the preview's 384px and the track measures itself with a `ResizeObserver`.

## Taste self-review

- One clear focal point: Yes. The pill track and its thumb are the only accent-colored, moving element; the fare summary above it is quiet and the fill turns solid only when a release will pay.
- Spacing on the 4px scale: Yes. Card padding 20 and 24px scaled by density, 24px between groups, a 4px track inset around a 56px thumb in a 64px track.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like a Stripe-grade checkout sheet: honest fare lines, VAT and refund small print, one deliberate action and a booking reference in mono.
- Meets its category brief: Yes. motion/react drag with springs (400/30) and velocity-aware release, snap-back, interruptible mid-animation, mouse, touch and an equivalent keyboard path, idle/active/disabled/loading/error/success all previewable, an aria-live region, reduced-motion fallback, optional vibrate, and `onChange`/`onComplete` plus typed labels, threshold, step, projection and spring props.
- Distinct from every other design in its category: Yes. It is the category's only horizontal drag-to-threshold gesture; the other micro-interactions are a press-to-submit morph and a press-and-hold fill.
