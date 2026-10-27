# Quorum workspace settings

## Usage notes

- Use it as the admin settings of a B2B workspace with seat-based pricing. It expects members with roles, API keys, usage meters with projections, and invoices.
- From 1024px of container width, billing and usage sit in a 340px right column. Narrower, they follow the members and keys panels. Below 672px the Last active and 2FA columns collapse to zero width but stay in the table, so columns keep their order. Each member's email stays under the name.
- The members table has a caption and row headers. Role selects are native, with labels such as "Role for Noor Haddad". The remove toggle is a pressed button ("Remove Felix Brandt" or "Keep Felix Brandt"). The owner's role can't change.
- The pending tray is a labelled region. A polite live region announces each queued change, discards, applies, key creation, copying and revocation. Apply errors use `role="alert"`.
- Revoke opens an inline confirmation group in that row with Cancel focused first. Revoke key is the only red button on the page. A new key shows its full secret once with Copy and a note to store it.
- Usage bars are `role="meter"` with a value text that includes the projection. The dashed tick marks the projected month-end value.
- States: default is a clean workspace; loading shows skeleton rows of the same height; error keeps two queued changes with the message and Retry apply; success lists what was applied with the time; empty has no API keys and offers Create your first key.

## Taste self-review

- One clear focal point: Yes. The pending tray: queued rows carry an accent edge, and the tray prices every change and the next invoice before anything is committed.
- Spacing on the 4px scale: Yes. Paddings are 8, 12 and 16px, row padding scales from 8px with `--iu-density`, and column widths are 44, 56, 112, 120 and 340px.
- Belongs in a Linear, Stripe or Vercel product: Yes. Billing consequences are explicit before you commit, keys are handled the way serious platforms handle them, and the data is set in tabular mono.
- Meets its category brief: Yes. Sections are grouped as members, keys, usage and billing; save states cover pending, applying, applied and failed; destructive actions (removing a member, revoking a key) need a second step before they take effect.
- Distinct from every other design in its category: Yes. Index is a calm single-user Swiss page with per-field edit markers; Quorum is a dense multi-panel admin whose edits batch into a priced diff tray.
