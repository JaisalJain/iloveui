# Margin notes

## Component

`MarginNotesTestimonials` is an editorial testimonial section set like a magazine spread on a paper page: a masthead with a thick-and-thin rule, then an issue index ("No. 01" to "No. 05", each with name, role and company) beside one featured pull quote in large serif italic. The opening quotation mark hangs in the margin in the accent color, so the text keeps a clean left edge. The index is a WAI-ARIA tablist with automatic activation that controls the quote panel. When the featured note changes, the quote swaps line by line: the outgoing lines fade and lift away from top to bottom, the incoming lines rise in with a short stagger, the byline arrives with the first line and the issue number in the folio rolls like an odometer, while the hanging mark stays still. Under reduced motion the swap is instant. There is no motion on first render, and the server-rendered markup shows the first note complete.

## Props

| Prop               | Type                                        | Default                      | Description                                                                                              |
| ------------------ | ------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `kicker`           | `string`                                    | `"Readers’ notes"`           | Small uppercase label at the top left of the masthead; also the index's accessible name.                 |
| `edition`          | `string`                                    | `"Vol. 3 · Autumn 2026"`     | Monospace label at the top right of the masthead.                                                        |
| `heading`          | `string`                                    | `"Notes from the margins"`   | The serif section heading (`h2`) above the index.                                                        |
| `intro`            | `string`                                    | One sentence about the notes | Supporting sentence under the heading.                                                                   |
| `notes`            | `MarginNote[]`                              | Five notes from researchers  | Index entries and their quotes, in issue order. Five to seven read best. An empty array renders nothing. |
| `defaultIndex`     | `number`                                    | `0`                          | The note featured on first render (clamped to the list).                                                 |
| `onSelectedChange` | `(note: MarginNote, index: number) => void` | none                         | Called whenever another note is featured, by click, arrow keys, Home or End.                             |
| `className`        | `string`                                    | `""`                         | Extra classes for the `<section>`.                                                                       |

`MarginNote` is `{ id: string; quote: string; name: string; role: string; company: string; date: string }`. Write `quote` without quotation marks (the component sets them), and `date` as an ISO date (`"2026-10-14"`), which is shown as "14 Oct 2026". Monograms come from the first and last word of `name`; the index row shows the first word only below a 48rem container, and snaps and fades its edges if long names make it scroll.

## Tokens

Reads `--iu-background` (section and monogram tiles), `--iu-surface` (the page), `--iu-border` (page frame, column rule, index row lines and folio rule), `--iu-foreground` (text, the thick-and-thin rule and the selected-entry marker), `--iu-muted` (intro, roles, dates and unselected entries), `--iu-accent` (only the hanging quotation mark and focus rings), `--iu-radius` (capped at 2px for the page and monograms), `--iu-font` (body and controls) and `--iu-density` (index row height). `--iu-accent-foreground` is not used because nothing is filled with the accent. Display type uses Tailwind's `font-serif` and captions use `font-mono`; define both in your theme. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` only. All motion is CSS transitions driven by a `data-state` attribute and CSS variables, so there is no animation library and no icon package. Tailwind CSS 4.1 or later (container queries are built in; the quote is sized with the CSS `cqi` unit, so it scales with its column). The HTML version is plain HTML with Tailwind classes and about 140 lines of vanilla JavaScript.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/margin-notes-testimonials` (or copy `component.tsx` to `components/iloveui/margin-notes-testimonials.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens` adds them).
3. Give `font-serif` a face with a true italic, for example Instrument Serif through `next/font`, mapped in your Tailwind theme with `--font-serif`. The pull quote is the focal point, and a synthesized italic loses the effect.
4. Render `<MarginNotesTestimonials notes={notes} />` and map your testimonials to `MarginNote`. Keep quotes between 20 and 30 words and close to each other in length: the quote area takes the height of the longest one, so nothing below it moves when the note changes.
5. Wire `onSelectedChange` to analytics if you want to know which notes people read.
6. For the HTML version, listen for the `margin-notes:change` event on the `[data-margin-notes]` section. Its `detail` holds `index` and `id`, read from each panel's `data-note` attribute.

## Customization ideas

- Turn it into a press section: set `kicker` to "In print", use publications as `company` and the article dates as `date`.
- Add a short title per note ("On provenance", "On peer review") as the first line of each index row for a table-of-contents feel.
- Replace the hanging quotation mark with an accent drop cap on the first word of each quote.
- Sync the featured note with the URL hash (`#no-03`) by lifting the selected index into your router and passing it as `defaultIndex` with a `key`.
- Lower `--iu-density` to 0.8 when the index has seven or more entries, so it stays level with the quote.
