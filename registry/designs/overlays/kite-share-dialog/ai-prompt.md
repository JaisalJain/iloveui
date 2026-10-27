# Kite share dialog

## Component

`KiteShareDialog` is a playful share-and-invite dialog for a collaborative board. It has a people picker (an editable combobox: type a name or email, pick a teammate from the suggestions or press Enter or comma to add any valid address), picked people as chips that pop in and join the overlapping avatar stack in the header, a role select for the new invites, the current members with per-person access selects (including Remove), general access as two radio cards, and a copy-link row whose button morphs into "Copied" with a check that draws itself. Feedback arrives as a sticker toast with a fuse that burns down and stops while the toast is hovered or focused. From 640px it is a centered dialog with a chunky offset shadow; below that it is a bottom sheet.

## Props

| Prop              | Type                                                        | Default                               | Description                                                    |
| ----------------- | ----------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| `boardName`       | `string`                                                    | `"Spring launch moodboard"`           | Name of the thing being shared.                                |
| `link`            | `string`                                                    | `"kitebook.app/b/spring-launch-7Kq2"` | Share link shown without its scheme; copied with it.           |
| `directory`       | `KitePerson[]`                                              | Six teammates and guests              | People the picker suggests.                                    |
| `members`         | `KiteMember[]`                                              | Owner plus two members                | People with access; `pending` shows the Invited tag.           |
| `defaultInvitees` | `KitePerson[]`                                              | `[]`                                  | Chips already in the picker.                                   |
| `defaultRole`     | `"edit" \| "comment" \| "view"`                             | `"comment"`                           | Role given to new invites.                                     |
| `defaultAccess`   | `"link" \| "invited"`                                       | `"link"`                              | General access setting.                                        |
| `defaultOpen`     | `boolean`                                                   | `false`                               | Opens the dialog on first render without moving focus.         |
| `defaultQuery`    | `string`                                                    | `""`                                  | Text already typed in the picker.                              |
| `status`          | `"idle" \| "sending" \| "error"`                            | `undefined`                           | Forces the invite request state.                               |
| `errorMessage`    | `string`                                                    | Mail service message                  | Copy of the send error.                                        |
| `initialToast`    | `KiteToast \| null`                                         | `null`                                | A toast shown on first render.                                 |
| `onInvite`        | `(people: KitePerson[], role: KiteRole) => void \| Promise` | `undefined`                           | Return a promise to show Sending; reject it to show the error. |
| `onCopyLink`      | `(link: string) => void`                                    | `undefined`                           | Called after the link is copied.                               |
| `onAccessChange`  | `(access: "link" \| "invited") => void`                     | `undefined`                           | Called when general access changes.                            |
| `onOpenChange`    | `(open: boolean) => void`                                   | `undefined`                           | Called when the dialog opens or closes.                        |
| `className`       | `string`                                                    | `""`                                  | Extra classes for the root.                                    |

## Tokens

Reads `--iu-background` (page), `--iu-surface` (dialog, chips, inputs), `--iu-foreground` (2px ink outlines, text), `--iu-muted` (secondary text), `--iu-accent` and `--iu-accent-foreground` (Send button, toast icon and fuse, the Invited tag, focus rings; the offset shadows and the single tint are mixed from the accent), `--iu-radius` (floored at 16 to 28px), `--iu-font` and `--iu-density` (section and member spacing). `--iu-border` is not needed: every edge is ink.

## Dependencies

`react`, `motion` (dialog entrance, chip and avatar pops, the drawn check, the toast and its fuse) and `lucide-react` (icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/kite-share-dialog` (or copy `component.tsx` into `components/iloveui/`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Pass your workspace directory to `directory` and the current access list to `members`, then render `<KiteShareDialog boardName={board.name} link={shareUrl} onInvite={invite} />`.
4. Make `onInvite` call your API and return its promise: the button shows Sending, a rejection keeps the chips and shows the error, a resolution moves them into the list as Invited and shows the toast.
5. Persist access changes through `onAccessChange` and per-member role changes by lifting `members` into your state if you need them on the server.

## Customization ideas

- Group suggestions into "Your team" and "Guests" with listbox group headings.
- Add an expiry select ("Link expires in 7 days") under general access.
- Replace the role select with a segmented control when only two roles exist.
- Swap the board preview behind the dialog for your own page; the dialog is self-contained.
- Show a small confetti burst drawn in SVG on the first invite of a board, skipped under reduced motion.
