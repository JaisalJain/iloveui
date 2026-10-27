# Kite share dialog

## Usage notes

- Use it wherever people share a document, board or project with teammates and guests. The board page behind is demo context and becomes `inert` while the dialog is open.
- The dialog is modal: labelled and described, focus moves to the picker when a person opens it, Tab and Shift+Tab cycle inside, Escape closes the suggestions first and the dialog second, and focus returns to the Share button. A dialog open on page load never steals focus.
- The picker follows the WAI-ARIA editable combobox with list autocomplete: arrows move through suggestions with `aria-activedescendant`, Enter or comma adds the highlighted person (or a typed email address), Escape closes the list and Backspace in an empty field removes the last chip. Unknown text shows an inline error linked with `aria-describedby`. Every chip has a labelled remove button.
- Member roles are native selects, and Remove takes the person off the list with a toast. General access is a native radio group drawn as cards.
- Copy link writes the full URL to the clipboard (and fails quietly in frames that block it, leaving the link visible), then the button says Copied with a check that draws itself for 1.8 seconds, and a toast confirms what the link allows.
- Toasts appear at the top so they never cover the sheet's actions; one at a time, with a fuse that burns down over 4.2 seconds and stops while the toast is hovered or focused. Messages are also announced in a polite status region.
- Below 640px the dialog is a bottom sheet with a handle, a scrolling body and a full-width primary action above the summary line.
- Motion uses bouncy springs only on interaction (chips, avatars, the check, the toast). Under reduced motion everything is instant and the Sending dots stand still.
- States: default (one guest picked), loading (sending two invites), error (send failed, chips kept) and success (two people added as Invited with the toast).

## Taste self-review

- One clear focal point: Yes. The vermilion Send button with its chunky shadow anchors the dialog; the only other accent marks are the toast and Invited tags that confirm what it did.
- Spacing on the 4px scale: Yes. Sections sit 24px apart (density scaled), member rows 8px, chips 6px, and the dialog pads 20 and 28px.
- Belongs in a Linear, Stripe or Vercel product: Yes. Under the playful skin it behaves like the best share dialogs: a real combobox, honest guest labelling, per-person roles, link scope stated in words and feedback that waits for you.
- Meets its category brief: Yes. Focus trap, Escape to close, focus returned to the trigger, toasts that pause on hover and focus, and a mobile bottom-sheet variant.
- Distinct from every other design in its category: Yes. It is the overlays category's only playful design and only share dialog, with a people-picker combobox, a growing avatar stack and single sticker toasts instead of a stacked deck.
