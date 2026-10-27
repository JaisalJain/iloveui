# Swipe triage alerts

## Usage notes

- Use it for any list people clear quickly: alerts, notifications, an inbox, a review queue. Each row needs an id, a title and two short metadata lines.
- Pointer and touch: drag a row sideways. Vertical drags still scroll the page (`touch-action: pan-y` and a direction lock). Release past the threshold or with a fast flick to commit, a little to leave the action button showing, or barely to snap back. Grabbing a row mid-animation catches it.
- Keyboard: the list is one tab stop with a roving focus. Up and Down (and Home, End) move between rows; Left reveals delete and a second Left commits it, Right does the same for archive; Enter commits the revealed action and Escape closes it; E archives, Delete or Backspace deletes, Z undoes. The revealed action buttons are real buttons that join the tab order only while visible.
- Screen readers: rows are described by a hint that lists the keys; commits, results, errors and restores are announced politely. After a row leaves, focus moves to its neighbour; after undo it returns to the restored row.
- States: default, active (mid-drag), loading (the handler is running), error (refused, row springs back with Retry), success (row gone, undo bar counting down), empty (one action) and disabled (view-only notice, nothing triages).
- Reduced motion: dragging still follows the finger, but every release, removal and restore lands instantly, and the countdown hairline stops animating while the seconds keep counting.
- The card fills its column; rows truncate long titles, and the key hints wrap at 375px.

## Taste self-review

- One clear focal point: Yes. The row under the finger: it is the only thing that moves, and its panel's gauge and "Release to delete" label say exactly when letting go will commit.
- Spacing on the 4px scale: Yes. Rows use 16px side padding, 12px column gaps and 14px vertical padding scaled by density; header, notices and the undo bar step in 4px multiples.
- Belongs in a Linear, Stripe or Vercel product: Yes. Mono service names and readings, dashed rules, semantic severity labels and a keyboard-first triage flow read like an on-call tool those teams ship.
- Meets its category brief: Yes. Motion drag with springs that inherit release velocity, snap-back and catch-mid-flight; mouse, touch and a full keyboard path; idle, active, loading, success, error and disabled states (plus empty); a polite live region; instant changes under reduced motion; optional vibration at the threshold and on success; onArchive, onDelete, onUndo, onComplete and onChange with typed labels, thresholds and durations.
- Distinct from every other design in its category: Yes. It is the category's only list-row gesture with two directional actions and an undo window; the slide-to-pay, hold-to-confirm, morphing-submit, reorder and code-entry designs share none of its layout or interaction.
