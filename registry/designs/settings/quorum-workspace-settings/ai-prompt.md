# Quorum workspace settings

## Component

`QuorumWorkspaceSettings` is a dense workspace admin page for a B2B product. The header shows the workspace, plan, seats used and the monthly bill. The left column holds a Members table and an API keys list. In the table you change roles with native selects and mark people for removal. The right column shows usage meters with month-end projections, plus a billing summary with recent invoices. Role and removal edits don't save one by one. They queue in a pending-changes tray under the table that reads like a diff. Each line shows the change and its monthly price impact, and the tray shows the next invoice before and after. Apply changes commits them all at once, so the bill changes once. API keys show their prefix, scopes and last use. A new key is revealed once with Copy. Revoking a key needs an inline confirmation in the key's row.

## Props

| Prop              | Type                                                 | Default                   | Description                                                                                                  |
| ----------------- | ---------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `workspace`       | `string`                                             | `"Fernhill Robotics"`     | Workspace name; its initials form the mark.                                                                  |
| `plan`            | `string`                                             | `"Team · billed monthly"` | Plan line under the name.                                                                                    |
| `seatLimit`       | `number`                                             | `15`                      | Seats included in the plan.                                                                                  |
| `basePrice`       | `number`                                             | `49`                      | Monthly base price in dollars.                                                                               |
| `seatPrice`       | `number`                                             | `14`                      | Price per paid seat (owners, admins and members; viewers are free).                                          |
| `members`         | `QuorumMember[]`                                     | Seven people              | Rows of the members table.                                                                                   |
| `apiKeys`         | `QuorumApiKey[]`                                     | Three keys                | Keys with prefix, scopes, dates and an optional `stale` flag. `[]` shows the empty state.                    |
| `meters`          | `QuorumMeter[]`                                      | Requests, storage, builds | Usage with limit and month-end projection; projections of 90% or more turn amber.                            |
| `invoices`        | `QuorumInvoice[]`                                    | Three months              | Recent invoices.                                                                                             |
| `nextInvoiceDate` | `string`                                             | `"1 Nov 2026"`            | Date of the next invoice.                                                                                    |
| `status`          | `"idle" \| "loading" \| "error" \| "success"`        | `"idle"`                  | Initial state: skeleton rows, a failed apply, or a just-applied set of changes.                              |
| `errorMessage`    | `string`                                             | Invoice-lock copy         | Message under the tray for `status="error"`.                                                                 |
| `appliedAt`       | `string`                                             | `"14:32"`                 | Time shown for `status="success"`.                                                                           |
| `pendingChanges`  | `QuorumChange[]`                                     | `[]`                      | Changes present on first render. With `success`, pass `from` and `name` so the applied lines read correctly. |
| `onApply`         | `(changes: QuorumChange[]) => Promise<void> \| void` | none                      | Persist the queued changes; throw an `Error` to show its message.                                            |
| `onInvite`        | `() => void`                                         | none                      | Open your invite flow.                                                                                       |
| `onCreateKey`     | `() => void`                                         | none                      | Called after a key is added; replace the demo secret with your API's.                                        |
| `onRevokeKey`     | `(keyId: string) => void`                            | none                      | Called after the inline confirmation.                                                                        |
| `onCopyKey`       | `(key: string) => void`                              | none                      | Called after the new key was copied.                                                                         |
| `className`       | `string`                                             | `""`                      | Extra classes for the root.                                                                                  |

## Tokens

Reads `--iu-surface` (panels, inputs), `--iu-background` (the tray and the revealed key), `--iu-border` (hairlines), `--iu-foreground` (text, zebra rows at 2.5%, meter fills at 75%, the workspace mark), `--iu-muted` (labels and secondary figures), `--iu-accent` (changed-row marker, changed select border, Apply changes and focus rings), `--iu-accent-foreground`, `--iu-radius` (capped at 6px), `--iu-font` and `--iu-density` (row padding). Amber marks risks (projection over 90%, 2FA off, stale keys), emerald marks healthy states, and red marks errors and the revoke action; each has an icon or text.

## Dependencies

`react`, `motion` (tray lines and the invoice figure) and `lucide-react` (icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/quorum-workspace-settings`.
2. Make sure the `--iu-*` tokens exist (`npx shadcn@latest add @iloveui/tokens`).
3. Load members, keys, usage and invoices, and pass `status="loading"` until they arrive.
4. Implement `onApply` as one request that changes roles and seats together; throw an `Error` with a human message on failure.
5. Set `seatPrice` and `basePrice` from your billing provider so the tray's price impact matches the real invoice.
6. Create keys on your server in `onCreateKey`, and swap the demo secret for the one your API returns. Show it once.

## Customization ideas

- Add a Guests role with a different seat price and show it as its own line in the billing summary.
- Group members by team with collapsible headers when a workspace passes 50 people.
- Add per-key scopes as editable chips that queue in the same tray.
- Turn the meters into a 30-day sparkline per resource.
- Require a second admin to approve pending changes over a cost threshold.
