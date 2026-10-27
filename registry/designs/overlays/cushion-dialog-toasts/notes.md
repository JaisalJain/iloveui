# Cushion dialog and toasts

## Usage notes

- Use it wherever an action needs a short, considered choice before it runs and a calm confirmation after: scheduling a send, booking a slot, publishing a release. The drafts list is real context for the demo and can be replaced by your own page.
- The dialog is a true modal: `role="dialog"`, `aria-modal`, a labelled title and description, and the page and toast stack behind it are `inert`. When a person opens it, focus moves to the selected day; Tab and Shift+Tab cycle inside; Escape, the scrim, Cancel and the close button dismiss it; focus returns to the button that opened it, which keeps its place as Reschedule after a successful send. A dialog that is open on page load never steals focus; the first Tab moves into it.
- Page scroll is locked while it is open, with the scrollbar width added back as padding so nothing shifts.
- Day and time are native radio groups inside fieldsets, so arrow keys work and screen readers hear the legend. Choosing Today disables the slots that have passed (shown dashed and struck through with "Passed today"), moves the selection to the next open slot and announces the move politely.
- Below 640px the dialog is a bottom sheet with a grab handle: drag it or the header down past 120px, or flick it, to dismiss; it springs back otherwise. The footer stacks with the primary action on top and respects the safe area.
- The primary button keeps its width through Scheduling (a spinner that stops under reduced motion) and turns into Try again beside an inline `role="alert"` error when the request fails.
- Toasts announce through a polite status region. The stack shows the newest card with two peeking behind; hovering or focusing it fans it out, labels it Paused with a Clear all action and freezes every countdown ring, which also stops while the tab is hidden. F8 moves focus to the stack. Undo restores the draft and confirms with a short info toast.
- Under reduced motion every transition is instant; the countdown rings still show the remaining time because they carry information.
- States: default (dialog open), loading (pending request), error (inline alert and Try again) and success (scheduled row with the toast stack fanned out).

## Taste self-review

- One clear focal point: Yes. In the dialog the selected send-time card is the one tinted object with the accent bar and Best tag, leading straight to the single vermilion button; after scheduling, the toast deck is the only thing that moves.
- Spacing on the 4px scale: Yes. Paddings and gaps are 4, 8, 12, 16, 20 and 28px; dialog sections sit 20px apart and list rows 12px, both scaled by `--iu-density`; toasts are 76px tall with 10px gaps.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like the scheduling sheet of a well-made publishing tool: predicted open rates instead of decoration, honest disabled slots, a precise summary line and toasts that wait while you read them.
- Meets its category brief: Yes. Focus trap with Tab cycling, Escape to close, focus returned to the trigger, stacked toasts that pause on hover and focus, and a mobile bottom-sheet variant with drag to dismiss.
- Distinct from every other design in its category: Yes. It is the overlays category's only soft-tactile design and the only one pairing a scheduling modal with a fanning toast deck and countdown rings.
