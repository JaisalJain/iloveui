# Index account settings

## Component

`IndexAccountSettings` is a full account settings page set on a Swiss grid. A sticky title row holds the save state, Discard and Save (Cmd/Ctrl+S). A numbered index on the left lists five sections. Sections sit on the right, each under a heavy rule: 01 Profile, 02 Sign-in, 03 Notifications (an email/push matrix), 04 Sessions and 05 Delete account. Every edited field gets a 2px accent hairline in its margin. The index and the section head count edits per section, and the status line counts unsaved changes. Save turns into Saving and then cross-fades to "Saved at 14:32". Deleting the account needs the username typed exactly; the target lights up character by character as it matches.

## Props

| Prop               | Type                                              | Default                | Description                                                                        |
| ------------------ | ------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| `product`          | `string`                                          | `"Isobar"`             | Product name in the caption and labels.                                            |
| `values`           | `IndexAccountValues`                              | Ilse's account         | The saved values: name, username, email, title, timezone, twoStep, notify map.     |
| `timezones`        | `{ value: string; label: string }[]`              | Five zones             | Options of the time zone select.                                                   |
| `notifyEvents`     | `{ id: string; label: string; detail: string }[]` | Four events            | Rows of the notification matrix; `notify` keys are `${id}.email` and `${id}.push`. |
| `sessions`         | `IndexSession[]`                                  | Three devices          | Signed-in devices; the `current` one can't be signed out.                          |
| `passwordChanged`  | `string`                                          | `"Changed 3 Feb 2026"` | Note beside the password.                                                          |
| `status`           | `"idle" \| "loading" \| "error" \| "success"`     | `"idle"`               | Initial state: skeletons, a failed save, or a just-finished save.                  |
| `errorMessage`     | `string`                                          | Username taken copy    | Banner text for `status="error"`.                                                  |
| `errorField`       | `keyof IndexAccountValues`                        | none                   | Field marked invalid with `status="error"`.                                        |
| `lastSaved`        | `string`                                          | `"09:12"`              | Time shown in the status line.                                                     |
| `pendingValues`    | `Partial<IndexAccountValues>`                     | none                   | Edits already present on first render, such as after a failed save.                |
| `onSave`           | `(values) => Promise<void> \| void`               | none                   | Persist the values; throw an `Error` to show its message as the save error.        |
| `onChangePassword` | `() => void`                                      | none                   | Open your password flow.                                                           |
| `onSignOutSession` | `(sessionId: string) => void`                     | none                   | Revoke one session.                                                                |
| `onSignOutOthers`  | `() => void`                                      | none                   | Revoke every session except this one.                                              |
| `onDeleteAccount`  | `() => Promise<void> \| void`                     | none                   | Called after the username was typed exactly.                                       |
| `className`        | `string`                                          | `""`                   | Extra classes for the root.                                                        |

## Tokens

Reads `--iu-background` (page and sticky title row), `--iu-surface` (inputs and checkboxes), `--iu-border` (row rules), `--iu-foreground` (type, section rules, checked boxes and the switch), `--iu-muted` (captions, hints, index numbers), `--iu-accent` (edit hairlines, index dots, the Save button and focus rings), `--iu-accent-foreground`, `--iu-radius` (capped at 6px for controls), `--iu-font` and `--iu-density` (row padding). Red is used only for the error state and the delete button, always with text.

## Dependencies

`react`, `motion` (the status cross-fade) and `lucide-react` (check, alert and spinner icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/index-account-settings`.
2. Make sure the `--iu-*` tokens exist (`npx shadcn@latest add @iloveui/tokens`).
3. Load the user's settings and pass them as `values`; show `status="loading"` while they load.
4. Implement `onSave` with your API call; throw `new Error("...")` with a human message when it fails, and pass `errorField` if the server names a field.
5. Wire `onSignOutSession`, `onSignOutOthers`, `onChangePassword` and `onDeleteAccount` to your auth provider.
6. Keep the component under your app shell; the title row sticks to the top of its scroll container.

## Customization ideas

- Add a sixth section for connected accounts (GitHub, Google) with connect and disconnect rows.
- Turn the notification matrix into three channels by adding a Slack column.
- Replace the type-to-confirm with a 10-second undo window after deletion.
- Collapse the index into a select at narrow widths for very long settings pages.
- Show an "Edited by you on another device" notice when the saved values change while editing.
