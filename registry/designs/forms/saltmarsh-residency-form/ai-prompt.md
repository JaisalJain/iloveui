# Saltmarsh residency form

## Component

`SaltmarshResidencyForm` is a long-form application in an editorial style: a serif masthead over a double rule, three numbered sections (About you, The stay, The work), underlined fields with always-visible labels, helper and error text, and a letter beside the form that writes itself from the answers. Each clause of the letter belongs to one field; the clause for the field you are editing is underlined in the accent, and unfilled clauses show as dashed blanks. Discipline is a WAI-ARIA select-only combobox, "Writing from" an editable combobox with list autocomplete, Season a radio group, and Statement a textarea with a live word count. Submitting validates, focuses the first problem and announces the count; a valid form shows Sending, then Application received, and the letter is stamped with a postmark.

## Props

| Prop             | Type                                | Default                          | Description                                                      |
| ---------------- | ----------------------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `residency`      | `string`                            | `"Saltmarsh Writers' Residency"` | Kicker at the top left.                                          |
| `season`         | `string`                            | `"2027 season"`                  | Kicker at the top right.                                         |
| `headline`       | `string`                            | Serif headline                   | The masthead line.                                               |
| `intro`          | `string`                            | Programme summary                | Paragraph under the headline.                                    |
| `disciplines`    | `SaltmarshOption[]`                 | Six disciplines                  | `{ value, label, phrase }`; `phrase` is used in the letter.      |
| `cities`         | `string[]`                          | 24 cities                        | "City, Country" strings offered by the combobox.                 |
| `seasons`        | `SaltmarshSeason[]`                 | Spring, Summer, Autumn           | `{ value, label, months }`.                                      |
| `defaultValues`  | `Partial<SaltmarshValues>`          | empty                            | Prefill, for drafts or editing.                                  |
| `errors`         | `SaltmarshErrors`                   | none                             | Errors to show at once, for example from the server.             |
| `status`         | `"idle" \| "loading" \| "success"`  | internal                         | Control the submit state from outside.                           |
| `disabled`       | `boolean`                           | `false`                          | Closes the form and shows `disabledReason`.                      |
| `disabledReason` | `string`                            | Closing-date sentence            | Why the form is closed.                                          |
| `autoFocus`      | `boolean`                           | `false`                          | Focus the first field on mount.                                  |
| `today`          | `string`                            | `"27 October 2026"`              | Date at the top of the letter and on the confirmation.           |
| `postmark`       | `string`                            | `"27 X 2026"`                    | Short date on the postmark.                                      |
| `decisionDate`   | `string`                            | `"15 January 2027"`              | When applicants hear back.                                       |
| `onSubmit`       | `(values) => Promise<void> \| void` | none                             | Called with valid values; reject to return to the editable form. |
| `className`      | `string`                            | `""`                             | Extra classes on the section.                                    |

## Tokens

Reads `--iu-surface` (the sheet), `--iu-background` (page and the letter paper), `--iu-border` (frames and the column rule), `--iu-foreground` (type, rules, field underlines at 55%, the submit button), `--iu-muted` (helper text, numerals), `--iu-accent` (focus underline, checked radio, the selected season tint, the active clause underline, the closed-form rule and the postmark ring), `--iu-radius` (capped at 2px), `--iu-font` and `--iu-density` (sheet padding). Serif comes from your `font-serif`. Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react`. Motion is CSS only (300ms color and underline transitions, a spinner while sending that stops under reduced motion). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/saltmarsh-residency-form` (or copy `component.tsx` into `components/iloveui/`).
2. Add the `--iu-*` tokens (`npx shadcn@latest add @iloveui/tokens`) and map `font-serif` to a book serif.
3. Render `<SaltmarshResidencyForm onSubmit={save} />`; `save` receives `SaltmarshValues` and should throw on failure so the form unlocks.
4. Map server validation errors into `errors` (keys match the field names) and pass `disabled` with `disabledReason` outside the application window.
5. Replace `disciplines`, `cities` and `seasons` with your own programme data; keep `phrase` short enough to read inside "I work in ___".

## Customization ideas

- Turn it into a restaurant booking: party size, date, seating select and a note, with the letter as the confirmation card.
- Add a fourth section for a writing sample upload and a line in the letter that names the file.
- Swap the letter for a printed ticket or invoice that fills in the same way.
- Load `cities` from your API and keep the combobox filter on the client.
- Raise `--iu-density` to 1.2 for a slower, more spacious long-form page.
