# Index account settings

## Usage notes

- Use it as the account page of a SaaS product. It expects the saved values, the list of sessions, and handlers for save, sign-out and deletion. Save failures come back as thrown errors whose message is shown verbatim.
- From 896px of container width the numbered index sits in the first three of twelve columns. Narrower, it is hidden and the section numbers carry the structure. From 672px each field row splits into a 180px label column and a control column; narrower, labels sit above controls. The notification matrix stays a table at every width.
- Every field has a visible label. The edited state is announced with "(edited)" after the label and in the index counts. Hints and errors are linked with `aria-describedby`, and the invalid field gets `aria-invalid`. The two-step control is a `role="switch"`, and the checkboxes are native inputs named "Mentions by email".
- The status line is a polite live region: "2 unsaved changes", "Saving", "Saved at 14:32", "Not saved". Cmd/Ctrl+S saves from anywhere in the form, and Discard restores the saved values.
- The delete confirmation is a plain text field. The button stays disabled until the text matches the username exactly. The matching characters of the target darken as you type, and a note counts them.
- States: default is a clean page; loading replaces controls with static blocks of the same size; error shows the banner, an invalid username and three edits with their hairlines; success shows "Saved at 14:32".
- Motion is limited to 150 to 180ms fades and 4px shifts on the status line and hairlines, and it is instant under reduced motion.

## Taste self-review

- One clear focal point: Yes. The save state: the accent Save button and the counted edits, echoed by thin accent hairlines exactly where the edits are.
- Spacing on the 4px scale: Yes. Paddings and gaps are 4px multiples (8, 12, 16, 24, 40, 64px), rows scale from 16px with `--iu-density`, and columns are 180px plus a 12-column grid.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is quiet and exact: numbered sections, rules instead of cards, tabular figures and one accent signal.
- Meets its category brief: Yes. Sections are grouped and numbered; save states cover unsaved, saving, saved and failed, with field-level errors; the danger zone needs the username typed before Delete account enables.
- Distinct from every other design in its category: Yes. It is a single-column Swiss page with a numbered index and per-field edit markers; the workspace settings design is a dense tabbed admin with members, billing and keys and a pending-changes tray.
