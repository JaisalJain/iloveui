# Shelfie library states

## Component

`ShelfieLibraryStates` is the content area of a reading app's library, with four states that share one frame (logo, search field, shelf tabs): no results for a search (the default), an empty first-run shelf, a load error and a loading skeleton. Each non-loading state has an SVG illustration built on the same shelf, an honest title and sentence, and exactly one action. The signature moment: pressing Add your first book drops a book into the first dashed slot on the empty shelf with a bounce before `onAddBook` fires. Try again keeps its width, spins while your `onRetry` promise is pending and marks the region busy. Illustrations give a single wiggle on hover. Loading shows static skeleton cards in the final layout.

## Props

| Prop                 | Type                                              | Default                       | Description                                                              |
| -------------------- | ------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `status`             | `"no-results" \| "empty" \| "error" \| "loading"` | `"no-results"`                | Which state to show.                                                     |
| `query`              | `string`                                          | `"the left hand of darkness"` | The search that found nothing; shown in the field and the title.         |
| `bookCount`          | `number`                                          | `214`                         | Books on the shelf, used in no-results and loading copy.                 |
| `errorReference`     | `string`                                          | `"504 · req 7f3a-19c2"`       | Status and request id under the error, for support.                      |
| `onAddBook`          | `() => void`                                      | none                          | Called after the book lands (about 520ms, instant under reduced motion). |
| `onRetry`            | `() => void \| Promise<void>`                     | none                          | Called by Try again; the button spins until the promise settles.         |
| `onSearchEverywhere` | `(query: string) => void`                         | none                          | Called by Search all of Shelfie.                                         |
| `className`          | `string`                                          | `""`                          | Extra classes for the card.                                              |

## Tokens

Reads `--iu-surface` (card, shelf planks), `--iu-background` (magnifier lens), `--iu-foreground` (2px outlines, active tab, the bookend), `--iu-muted` (body copy, dashed slots, error reference), `--iu-accent` (book spines, plant, primary buttons, spinner, focus rings; tints mix it 22% into the surface; the offset shadow mixes it 30% into the foreground or background), `--iu-accent-foreground`, `--iu-radius` (floored at 16 to 24px), `--iu-font` and `--iu-density` (header, body and skeleton padding). The snapped bracket in the error art uses the semantic red. Add tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the book drop, state cross-fade and hover wiggle) and `lucide-react` (search, plus, check, retry and loader icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/shelfie-library-states` (or copy `component.tsx` to `components/iloveui/shelfie-library-states.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render it where your list renders and derive `status` from your data: `loading` while fetching, `error` on failure, `empty` when the list is empty with no query, `no-results` when a query returns nothing.
4. Pass `onRetry` as your refetch function (return its promise), `onAddBook` to open your add flow and `onSearchEverywhere` to widen the search.
5. Replace the frame's tabs and logo with your own, keeping one action per state.

## Customization ideas

- Swap the shelf for a pantry, a garden bed or a garage: keep one base object across every state so they read as a family.
- Add an `offline` status that shows the shelf under a small cloud with a Retry when online action.
- Show the three most recent searches as chips under the no-results action.
- Let the empty state accept a list of suggested books and drop the chosen one into the slot.
- Use `--iu-density` 0.8 to fit it inside a sidebar panel.
