# Quire research assistant

## Component

`QuireResearchAssistant` is a research answer set like a magazine page. A double-ruled masthead carries the desk name and a research-credit meter. The question is the headline, in serif italic, with a byline. A Method disclosure lists the search queries and how many sources were read. The answer is written word by word, with a serif lead, body paragraphs, numbered inline citations and a slope figure. A sources column fills as sources are cited. Choosing a citation (in the text or in the column) draws an accent rule under every sentence that cites it and unfolds the exact quoted passage with its locator. The follow-up composer has attachments, a depth selector (the model), Ask, and Stop while writing.

## Props

| Prop                    | Type                                          | Default                 | Description                                                               |
| ----------------------- | --------------------------------------------- | ----------------------- | ------------------------------------------------------------------------- |
| `desk`                  | `string`                                      | `"Quire research desk"` | Masthead label.                                                           |
| `question`              | `string`                                      | Four-day week question  | The headline.                                                             |
| `askedBy` / `askedAt`   | `string`                                      | Hana Sato, a date       | Byline under the masthead.                                                |
| `questionAttachments`   | `QuireAttachment[]`                           | One PDF                 | Files attached to the question, listed under it.                          |
| `queries`               | `QuireQuery[]`                                | `QUIRE_QUERIES`         | Search queries with result and read counts for the Method disclosure.     |
| `searchSeconds`         | `number`                                      | `6.2`                   | Duration shown on the Method row.                                         |
| `blocks`                | `QuireBlock[]`                                | `QUIRE_BLOCKS`          | The answer: `lead`, `paragraph` (sentences with `cites`) and `figure`.    |
| `sources`               | `QuireSource[]`                               | `QUIRE_SOURCES`         | Numbered sources with publisher, year, kind, passage, locator and domain. |
| `status`                | `"idle" \| "streaming" \| "error"`            | `"idle"`                | `streaming` writes the answer; `error` stops it with an honest note.      |
| `streamFrom`            | `number`                                      | `0`                     | Where writing (or the failure) starts, 0 to 1.                            |
| `errorMessage`          | `string`                                      | Archive timeout copy    | Text of the incomplete-answer note.                                       |
| `models`                | `QuireModel[]`                                | Scholar, Brief, Survey  | Options of the depth listbox.                                             |
| `defaultModelId`        | `string`                                      | `"scholar"`             | Initially selected depth.                                                 |
| `attachments`           | `QuireAttachment[]`                           | `[]`                    | Files already attached to the follow-up.                                  |
| `credits`               | `{ used: number; limit: number }`             | `38 / 120`              | The masthead meter; it ticks up when an answer finishes.                  |
| `answerMeta`            | `string`                                      | Model, tokens, credits  | Mono line beside the message actions.                                     |
| `defaultActiveCitation` | `number \| null`                              | `1`                     | Citation open on first render.                                            |
| `onSend`                | `(m: { text; attachments; modelId }) => void` | none                    | Ask a follow-up.                                                          |
| `onStop` / `onRetry`    | `() => void`                                  | none                    | Stop writing (button or Escape); retry the search.                        |
| `onCopy`                | `(text: string) => void`                      | none                    | Called after the answer was copied with numbered footnotes.               |
| `onModelChange`         | `(modelId: string) => void`                   | none                    | Depth chosen.                                                             |
| `onAttach`              | `(files: File[]) => void`                     | none                    | Files picked through Attach.                                              |
| `onOpenSource`          | `(source: QuireSource) => void`               | none                    | Open the source from its passage.                                         |
| `onStreamEnd`           | `() => void`                                  | none                    | Writing finished; set `status` back to `"idle"`.                          |
| `className`             | `string`                                      | `""`                    | Extra classes for the root.                                               |

## Tokens

Reads `--iu-surface` (the page), `--iu-border` (column rules and row lines), `--iu-foreground` (ink, double rules at 40%, the active citation fill, the Ask button), `--iu-muted` (bylines, captions, mono metadata), `--iu-background` (text on the active citation and Ask), `--iu-accent` (the one editorial mark: the citation rule, the passage rule, the figure's end point and number, the credit bar, the caret and focus rings), `--iu-radius` (capped at 2px), `--iu-font` and `--iu-density` (source row padding). Serif and mono come from the host's `font-serif` and `font-mono`.

## Dependencies

`react`, `motion` (disclosures, source arrival, credit bar) and `lucide-react` (icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/quire-research-assistant`.
2. Make sure the `--iu-*` tokens exist (`npx shadcn@latest add @iloveui/tokens`) and that `font-serif` maps to a serif you like.
3. Convert your retrieval output to `sources` (keep the exact quoted passage and a locator) and the answer to `blocks`, attaching source numbers to each sentence through `cites`.
4. While your model writes, pass `status="streaming"`; set it back to `"idle"` in `onStreamEnd` and `onStop`, and abort the request in `onStop`.
5. When retrieval fails partway, pass `status="error"` with `streamFrom` at the last safe point, so nothing uncited is shown.
6. Wire `onOpenSource` to your document viewer or the source URL.

## Customization ideas

- Swap the slope figure for a small bar chart or a table when a source compares more than two values.
- Show a confidence label per paragraph (Strong, Mixed, Thin) in the left margin on wide screens.
- Group sources by kind (studies, reports, press) with small headings in the column.
- Add an Export to notes action that writes the answer and footnotes as Markdown.
- Let a citation pair with two passages when a sentence relies on a comparison.
