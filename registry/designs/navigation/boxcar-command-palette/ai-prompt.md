# Boxcar command palette

## Component

`BoxcarCommandPalette` is a neo-brutalist command palette for a project tracker: a trigger bar with a `⌘K` hint and a modal dialog with a black title strip, a large bold search field, grouped results and a footer of keyboard hints. With an empty query it shows Recent items, then suggested Actions and Go to pages, each with shortcut chips. Typing searches every item and regroups the results into Issues, Projects, People and Commands with the match underlined. Typing `>`, `#` or `@` first turns the prefix into a rotated scope sticker (Commands, Projects, People) that Backspace removes. The active row is a solid accent block with a 2px outline and a hard offset shadow that snaps between rows in 100ms; Enter presses the row into its shadow before the palette closes. A designed empty state (an oversized 0 sticker, honest copy, and a Create issue option) and a static skeleton loading state are included.

It follows the WAI-ARIA combobox pattern inside a modal dialog: the input is a `combobox` with `aria-activedescendant`, results are a `listbox` with labelled `group`s and `option`s.

## Props

| Prop            | Type                         | Default                            | Description                                                   |
| --------------- | ---------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| `recent`        | `BoxcarItem[]`               | Three recent items                 | Shown first while the query is empty.                         |
| `suggestions`   | `BoxcarGroup[]`              | Actions and Go to                  | Groups shown after Recent while the query is empty.           |
| `index`         | `BoxcarItem[]`               | Issues, projects, people, commands | Everything the query searches (label and meta).               |
| `open`          | `boolean`                    | uncontrolled                       | Controlled open state.                                        |
| `defaultOpen`   | `boolean`                    | `false`                            | Initial open state when uncontrolled.                         |
| `onOpenChange`  | `(open: boolean) => void`    | none                               | Called when the palette opens or closes.                      |
| `defaultQuery`  | `string`                     | `""`                               | Initial query; a leading `>`, `#` or `@` sets the scope.      |
| `status`        | `"idle" \| "loading"`        | `"idle"`                           | `"loading"` shows skeleton rows while remote results arrive.  |
| `hotkey`        | `boolean`                    | `true`                             | Toggle the palette with Cmd+K or Ctrl+K anywhere on the page. |
| `closeOnSelect` | `boolean`                    | `true`                             | Close after a choice.                                         |
| `onSelect`      | `(item: BoxcarItem) => void` | none                               | Called with the chosen item after the press.                  |
| `onCreate`      | `(query: string) => void`    | none                               | Called from the empty state's Create issue option.            |
| `triggerLabel`  | `string`                     | `"Search or jump to"`              | Text in the trigger bar.                                      |
| `className`     | `string`                     | `""`                               | Extra classes for the wrapper.                                |

`BoxcarItem` is `{ id: string; label: string; kind: "issue" | "project" | "person" | "action" | "page"; meta?: string; shortcut?: string[] }`. `BoxcarGroup` is `{ id: string; label: string; items: BoxcarItem[] }`.

## Tokens

Reads `--iu-foreground` (outlines, hard shadows, the title strip, the scope sticker), `--iu-surface` (panel and trigger), `--iu-background` (hatched backdrop and strip text), `--iu-muted` (group labels, meta, hints), `--iu-accent` and `--iu-accent-foreground` (the active row block and its text, focus rings), `--iu-radius` (capped at 4px), `--iu-font` and `--iu-density` (row height). Add them with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the snapping active block, the scope sticker and the open transition) and `lucide-react` (search, kind and Enter icons). Tailwind CSS 4.1 or later; mono labels use your `font-mono`.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/boxcar-command-palette` (or copy `component.tsx` to `components/iloveui/boxcar-command-palette.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render it once in your app shell, where the trigger bar belongs in your top bar. Keep `hotkey` on in exactly one instance.
4. Build `index` from your data (issues, projects, people and commands) and keep `recent` in your own store; push the chosen item there in `onSelect`.
5. Route in `onSelect` (`router.push` for pages, run the command for actions) and create the issue in `onCreate`.
6. For server search, control the query through `defaultQuery` and a `key`, set `status="loading"` while the request is in flight, then pass the results as `index`.

## Customization ideas

- Add a preview pane to the right of the list on wide screens that shows the active issue's status and assignee.
- Add a `/` scope for slash commands that take an argument, shown as a second sticker.
- Show the number of open issues in each project as a sticker inside the row.
- Let `onSelect` keep the palette open (`closeOnSelect={false}`) for bulk actions such as labelling several issues.
- Swap the hatched backdrop for a solid `--iu-foreground` at 60% for a darker stage.
