# Invoice morph submit

## Component

`InvoiceMorphSubmit` is a small invoice form on a Swiss grid (numbered fields 01 to 03 under an oversized amount that updates as you type) whose send button morphs through idle, sending, sent and try again without changing size. Every label sits in one grid cell, so the button is always as wide as its longest label. While sending, the label lifts and cross-fades, three dots step to show work is still happening and a 2px accent hairline eases along the button's bottom edge toward 90%; when the send resolves the hairline completes and a check draws itself. A failed send turns the button into an outlined "Try again" with the reason underneath. Email is validated inline on submit. A polite live region announces each state.

## Props

| Prop                 | Type                                             | Default                 | Description                                                       |
| -------------------- | ------------------------------------------------ | ----------------------- | ----------------------------------------------------------------- |
| `brand`              | `string`                                         | `"Quillmark"`           | Product name in the top rule.                                     |
| `invoiceNumber`      | `string`                                         | `"INV-2026-0418"`       | Shown in mono and used in announcements.                          |
| `clientName`         | `string`                                         | `"Marlowe & Daughters"` | Who the invoice is for.                                           |
| `dueLabel`           | `string`                                         | `"Due 14 Nov 2026"`     | Right side of the top rule.                                       |
| `currencySymbol`     | `string`                                         | `"€"`                   | Prefix for the amount.                                            |
| `defaultValues`      | `Partial<InvoiceDraft>`                          | Filled draft            | Starting `email`, `amount` and `memo`.                            |
| `labels`             | `Partial<InvoiceSubmitLabels>`                   | See source              | Button text for `idle`, `loading`, `success` and `error`.         |
| `errorMessage`       | `string`                                         | Mail server sentence    | Shown and announced on error.                                     |
| `successMessage`     | `string`                                         | Delivered sentence      | Shown and announced on success.                                   |
| `expectedDurationMs` | `number`                                         | `1600`                  | How long the hairline takes to ease to 90%.                       |
| `minLoadingMs`       | `number`                                         | `600`                   | Minimum time in the loading state so fast responses do not flash. |
| `resetAfterMs`       | `number`                                         | `0`                     | Return to idle after success; `0` keeps the success state.        |
| `status`             | `"idle" \| "loading" \| "error" \| "success"`    | uncontrolled            | Control the state yourself.                                       |
| `disabled`           | `boolean`                                        | `false`                 | Disables the button and shows `disabledReason`.                   |
| `disabledReason`     | `string`                                         | Recipient sentence      | Why the button is disabled.                                       |
| `forceState`         | `"active"`                                       | none                    | Renders the pressed look for docs and previews.                   |
| `onChange`           | `(draft: InvoiceDraft) => void`                  | none                    | Called on every field edit.                                       |
| `onSubmit`           | `(draft: InvoiceDraft) => void \| Promise<void>` | none                    | Send the invoice. Resolve for success, reject for error.          |
| `onComplete`         | `(draft: InvoiceDraft) => void`                  | none                    | Called once success shows.                                        |
| `className`          | `string`                                         | `""`                    | Extra classes for the form.                                       |

## Tokens

Reads `--iu-foreground` (top rule, button fill), `--iu-background` (button text), `--iu-surface` (form and inputs), `--iu-border` (rules), `--iu-muted` (labels), `--iu-accent` (only the progress hairline and focus rings), `--iu-radius` (capped at 6px), `--iu-font` and `--iu-density` (padding). Add them with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (label cross-fade, hairline and check drawing) and `lucide-react` (arrow, retry and alert icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/invoice-morph-submit` (or copy `component.tsx` into `components/iloveui/`).
2. Make sure the `--iu-*` tokens exist in your global CSS.
3. Pass `onSubmit={(draft) => api.sendInvoice(id, draft)}`; reject the promise with your error to show the retry state.
4. Set `expectedDurationMs` close to your real median send time so the hairline feels honest.
5. Use `onComplete` to route to the invoice or refresh a list; set `resetAfterMs` if the form stays on screen for the next invoice.

## Customization ideas

- Reuse the button alone for any async submit: keep the stacked-label grid and the hairline.
- Replace the stepping dots with a mono elapsed timer for slow jobs such as exports.
- Add a 04 Due date field as a segmented choice (On receipt, Net 15, Net 30).
- Show the sent timestamp in the top rule after success.
- Drive `status` from a server action's pending state instead of the internal promise.
