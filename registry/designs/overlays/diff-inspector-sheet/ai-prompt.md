# Diff inspector sheet

## Component

`DiffInspectorSheet` is a record inspector for an admin or back-office table, set in the Swiss style: a supplier table and a side sheet that opens over it to edit one record. The form is split into numbered sections (01 Identity, 02 Billing, 03 Limits) with indexed fields (1.1, 2.1 and so on). Every field that differs from the saved record gets an accent hairline in the sheet's gutter and a mono "was" note with the previous value struck through, and the footer counts the changes in a large numeral with their indices. Closing with unsaved edits does not throw a second modal: the footer turns into an inline confirmation (Keep editing, Discard) that takes focus. From 640px the sheet docks to the right edge at 520px; below that it is a bottom sheet.

## Props

| Prop            | Type                                                          | Default                | Description                                                                      |
| --------------- | ------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| `title`         | `string`                                                      | `"Suppliers"`          | Page heading above the table.                                                    |
| `suppliers`     | `DiffSupplier[]`                                              | Five suppliers         | Rows: `{ id, code, city, since, spendYtd, status, values }`.                     |
| `defaultOpenId` | `string \| null`                                              | `null`                 | Opens the inspector for this record on first render without moving focus.        |
| `defaultEdits`  | `Partial<DiffSupplierValues>`                                 | `undefined`            | Unsaved edits already present when the inspector first opens.                    |
| `status`        | `"idle" \| "saving" \| "error" \| "saved"`                    | `undefined`            | Forces the save state.                                                           |
| `errorMessage`  | `string`                                                      | Ledger timeout message | Copy of the save error.                                                          |
| `savedAt`       | `string`                                                      | `"14:32"`              | Time shown after a successful save.                                              |
| `approvalLimit` | `number`                                                      | `250000`               | Credit limits above this fail validation with an approval message.               |
| `onSave`        | `(id: string, values: DiffSupplierValues) => void \| Promise` | `undefined`            | Return a promise to show Saving; reject it to keep the edits and show the error. |
| `onDiscard`     | `(id: string) => void`                                        | `undefined`            | Called when unsaved edits are discarded.                                         |
| `onOpenChange`  | `(open: boolean) => void`                                     | `undefined`            | Called when the inspector opens or closes.                                       |
| `className`     | `string`                                                      | `""`                   | Extra classes for the root.                                                      |

`DiffSupplierValues` is `{ legalName, email, terms: "15" | "30" | "45" | "60", currency: "GBP" | "EUR" | "USD", creditLimit: string, holdAboveLimit: boolean }`. `DIFF_SUPPLIERS` exports the demo data.

## Tokens

Reads `--iu-background` (page), `--iu-surface` (sheet and inputs), `--iu-border` (row and field rules), `--iu-foreground` (type, section rules, the selected term, the primary button), `--iu-muted` (labels, indices, "was" notes), `--iu-accent` (only the change markers and focus rings), `--iu-radius` (capped at 6px for controls), `--iu-font` and `--iu-density` (row and field rhythm, input height).

## Dependencies

`react`, `motion` (sheet entrance, "was" notes and the change counter cross-fade) and `lucide-react` (close, check and alert icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/diff-inspector-sheet` (or copy `component.tsx` into `components/iloveui/`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Map your records to `DiffSupplier` and render `<DiffInspectorSheet suppliers={rows} onSave={saveSupplier} />`.
4. Make `onSave` call your API and return its promise. Resolve to mark the record saved and update its table row; reject to keep the edits and show the error above the footer.
5. Wire `onDiscard` if you track drafts server-side, and `onOpenChange` to sync the open record with the URL (for example `?supplier=sup-0418`).
6. To inspect a different record type, change `DiffSupplierValues`, `FIELD_ORDER`, `FIELD_LABEL`, `FIELD_INDEX` and the three fieldsets; the change tracking, confirmation, trap and shortcuts are generic.

## Customization ideas

- Add an "Activity" section listing who changed each field and when, using the same indices.
- Show the full diff in the confirmation ("2.1 Net 30 to Net 45") before Discard.
- Keep the sheet non-modal on wide screens so the table stays usable beside it.
- Add previous and next record buttons in the header that ask the same question before moving on.
- Swap the payment-terms segmented control for a select when there are more than five options.
