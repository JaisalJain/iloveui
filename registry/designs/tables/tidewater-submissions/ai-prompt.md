# Tidewater submissions

## Component

`TidewaterSubmissions` is a review queue set like a magazine page, built for any list people read and decide on together: submissions, applications, proposals, pull requests for docs. A masthead with a double rule and an italic serif headline sits over a sticky "Order by" bar (Received, Length, Title, Author; a second click reverses). Each entry is a numbered line: the serif numeral is the checkbox, and selecting it turns the numeral into a check and draws an accent rule down the margin. When the order changes, entries glide to their new places. Below the list a colophon states the selection in prose ("Two pieces · 7,820 words, about 34 minutes of reading") with Shortlist, Decline and Clear; after an action it confirms in italics with Undo. Pagination uses serif page numbers with Newer and Older links.

## Props

| Prop              | Type                      | Default                  | Description                                                      |
| ----------------- | ------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `publication`     | `string`                  | `"Tidewater Review"`     | Kicker on the left of the masthead.                              |
| `issue`           | `string`                  | `"Winter 2026 · No. 31"` | Mono label on the right of the masthead.                         |
| `headline`        | `string`                  | `"The reading pile"`     | Italic serif title.                                              |
| `standfirst`      | `string`                  | Deadline sentence        | One or two sentences beside the title.                           |
| `submissions`     | `TidewaterSubmission[]`   | 16 sample pieces         | Entries. An empty array renders "The pile is empty."             |
| `pageSize`        | `number`                  | `6`                      | Entries per page.                                                |
| `wordsPerMinute`  | `number`                  | `230`                    | Reading speed used for the selection's reading time.             |
| `defaultSelected` | `string[]`                | `[]`                     | Ids selected on first render.                                    |
| `initialNotice`   | `string`                  | none                     | A confirmation shown in the colophon on first render.            |
| `status`          | `"ready" \| "loading"`    | `"ready"`                | Loading shows static skeleton entries.                           |
| `onShortlist`     | `(ids: string[]) => void` | none                     | Bulk action; entries are marked shortlisted locally.             |
| `onDecline`       | `(ids: string[]) => void` | none                     | Bulk action; entries leave the list locally, Undo restores them. |
| `onOpen`          | `(id: string) => void`    | none                     | Called when a title is clicked; otherwise titles link to `#id`.  |
| `onOpenCall`      | `() => void`              | none                     | The empty state's action.                                        |
| `className`       | `string`                  | `""`                     | Extra classes for the `<section>`.                               |

`TidewaterSubmission` is `{ id; title; author; form: "Essay" | "Fiction" | "Poetry" | "Reportage"; words: number; received: string (ISO date); status: "unread" | "first-read" | "second-read" | "shortlisted"; reader?: string }`.

## Tokens

Reads `--iu-surface` (the page and sticky bar), `--iu-border` (entry rules), `--iu-foreground` (ink, double rules, primary button fill), `--iu-muted` (numerals, bylines, kickers), `--iu-accent` (only editorial marks: the margin rule, the active sort underline, the current page underline, the shortlist diamond and focus rings), `--iu-radius` (capped at 2px), `--iu-font` for body and `--iu-density` for entry spacing. Titles use the project's `font-serif`.

## Dependencies

`react`, `motion` (reorder, colophon cross-fade) and `lucide-react` (arrows and the check). Tailwind CSS 4.1 or later, with a serif mapped to `font-serif` (Instrument Serif in iloveui previews).

## Integration steps

1. Run `npx shadcn@latest add @iloveui/tidewater-submissions` (or copy `component.tsx` into `components/iloveui/`).
2. Add the `--iu-*` tokens (`npx shadcn@latest add @iloveui/tokens`) and define `--font-serif` in your Tailwind theme.
3. Map your records to `TidewaterSubmission` and pass them as `submissions`; refetching with a new array replaces local changes.
4. Wire `onShortlist` and `onDecline` to your API. Both update the list optimistically and offer Undo for 8 seconds; call your API's reverse endpoint if the user undoes.
5. Pass `status="loading"` while the first page loads.

## Customization ideas

- Rename the forms and statuses for a grant committee: Proposal, Budget, Letter; Unscored, Scored, Funded.
- Add a third bulk action, "Assign reader", that opens a menu of editors.
- Show the reader's initials as monograms in a stacked column on wide screens.
- Replace the reading time with an estimated fee (words times rate) for commissioning editors.
- Increase `--iu-density` to 1.25 for a more spacious, print-like page.
