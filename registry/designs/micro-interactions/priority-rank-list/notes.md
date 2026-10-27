# Priority rank list

## Usage notes

- Use it wherever order is the decision: roadmap priorities, a backlog's top ten, a playlist or setlist, an onboarding checklist's order. Items need an id, a title, an owner and a size estimate.
- Pointer and touch: only the grip handle starts a drag (`touch-action: none` on the handle, so the page still scrolls from the card). The card lifts 3%, leans with the drag velocity and the others spring aside; on release it springs into place from the release velocity. Grabbing again mid-flight catches it.
- Keyboard: Tab to a handle, Space or Enter picks the card up, Up and Down (or Home and End) move it, Space or Enter drops it, Escape puts it back where it started, and tabbing away drops it. Focus stays on the moving handle.
- Screen readers: each handle is named "Move <title>, rank N of M", described by the visible instructions, and reports `aria-pressed` while picked up. Pick-up, every step, crossing the cutoff, drop, save and errors are announced politely. The capacity meter is a `meter` with a text value.
- States: default, active (card picked up), loading (saving, handles paused), success (drawn check), error (previous order restored, Try again), empty (illustration and one action) and disabled (lock notice, locked handles).
- Reduced motion: dragging still follows the pointer, but the tilt is off and every settle, re-rank and status change is instant.
- Responsive: the capacity meter moves under the title below 640px; long titles truncate and the owner name shrinks before the estimate does.

## Taste self-review

- One clear focal point: Yes. The lifted card: it is the only thing tilted, scaled and wearing the accent shadow, and the capacity meter answers what moving it costs.
- Spacing on the 4px scale: Yes. 14px gaps between cards scaled by density, 12px card padding, 12 to 16px internal gaps, 24px between header and list.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is a planning tool those teams would ship for a quarterly stack rank, with capacity tied to estimates, autosave and full keyboard support.
- Meets its category brief: Yes. Motion drag with springs that inherit release velocity and a velocity-driven tilt, snap into place and catch mid-flight; mouse, touch and keyboard (Space, arrows, Space, Escape); idle, active, loading, success, error and disabled states; a polite live region; instant changes under reduced motion; optional vibration; onChange and onComplete with typed cutoff, capacity, labels and durations.
- Distinct from every other design in its category: Yes. It is the only vertical reorder in the category; the swipe, slide, hold and morph designs commit a single action, while this one rearranges a whole list and shows the consequence live.
