# Diff inspector sheet

## Usage notes

- Use it to edit one record of a list without leaving the list: suppliers, customers, invoices, feature flags. The table behind is real context and becomes `inert` while the sheet is open.
- The sheet is a modal dialog labelled by the record name. When a person opens it, focus moves to the first field; Tab and Shift+Tab cycle inside it; the close button, the scrim and Escape ask before closing when there are unsaved edits, and close at once when there are none; focus returns to the record's name in the table. A sheet that is open on page load never steals focus.
- Change tracking compares every field with the saved record: the gutter marker, the bold index and the "was" note appear only while a value differs, so typing a value back to its original clears them. The footer shows the count and the indices of what changed, and Revert all restores the record.
- The unsaved-changes confirmation is an inline `alertdialog` in the footer rather than a nested modal: focus moves to Keep editing, the form behind it is inert, Escape keeps editing and Discard closes without saving.
- Cmd+S or Ctrl+S saves. Validation runs on blur for email and credit limit and on save for everything; errors carry an icon, set `aria-invalid` and are linked with `aria-describedby`, and save moves focus to the first invalid field.
- Saving keeps the button width, disables the fields and announces the result politely. A failed save shows a `role="alert"` message and keeps every edit.
- Payment terms are a native radio group styled as a segmented control; currency is a native select so it works with any input method.
- Below 640px the sheet becomes a bottom sheet up to 90% of the viewport with a scrolling body and a footer that respects the safe area. Motion is a 180ms fade with a 4px shift and is instant under reduced motion.
- States: default (two unsaved edits), loading (saving), error (invalid fields plus a save error) and success (saved record, its row updated in the table).

## Taste self-review

- One clear focal point: Yes. The accent appears only as the change markers in the gutter, so the eye goes straight to what was edited, then to the oversized change count beside Save.
- Spacing on the 4px scale: Yes. Field rows are 14px top and bottom scaled by density, the sheet pads 24 and 32px, gaps are 8, 12 and 16px, and inputs are 40px tall.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is the record inspector those teams ship for back-office tools: precise rules, mono metadata, honest validation and a confirmation that respects the work already done.
- Meets its category brief: Yes. Focus trap, Escape to close (with confirmation), focus returned to the opening row, a mobile bottom-sheet variant, and polite announcements in place of toasts for save feedback.
- Distinct from every other design in its category: Yes. It is the overlays category's only side sheet, the only Swiss-minimal overlay, and the only one that tracks a diff of the record and confirms inline.
