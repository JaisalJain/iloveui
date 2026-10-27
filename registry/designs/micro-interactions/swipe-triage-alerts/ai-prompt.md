# Swipe triage alerts

## Component

`SwipeTriageAlerts` is an on-call alert list whose rows swipe to triage. Drag a row left to delete or right to archive: the action panel appears behind it with a hairline gauge that fills toward the commit point, and the label changes to "Release to delete" once the row passes it. Release decides with position and velocity: past the threshold, or flung faster than `velocityThreshold`, the row commits; a shorter drag settles open on its action button; anything less springs back, carrying the release velocity. Committed rows show a loading panel while your handler runs, then leave and the rows below glide up; a timed undo bar (pauses on hover or focus) brings the row back to its place. A rejected handler springs the row back with an inline error and a Retry button. Every gesture has a keyboard path, and every change is announced through a polite live region.

## Props

| Prop                | Type                                            | Default                  | Description                                                                   |
| ------------------- | ----------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `items`             | `SwipeAlert[]`                                  | Five production alerts   | Rows. An empty array shows the empty state.                                   |
| `eyebrow`           | `string`                                        | `"Nightjar on-call"`     | Mono label above the title.                                                   |
| `title`             | `string`                                        | `"Open alerts"`          | Heading; also labels the list.                                                |
| `environment`       | `string`                                        | `"production"`           | Shown beside the open count and in the empty state.                           |
| `archiveLabel`      | `string`                                        | `"Archive"`              | Right-swipe action name.                                                      |
| `deleteLabel`       | `string`                                        | `"Delete"`               | Left-swipe action name.                                                       |
| `commitThreshold`   | `number`                                        | `0.45`                   | Fraction of the row width a slow release must pass to commit.                 |
| `velocityThreshold` | `number`                                        | `650`                    | Release speed in px/s that commits a shorter swipe.                           |
| `revealWidth`       | `number`                                        | `96`                     | How far a row stays open to show its action button, in px.                    |
| `undoDuration`      | `number`                                        | `5000`                   | Undo window in ms.                                                            |
| `haptics`           | `boolean`                                       | `true`                   | Short `navigator.vibrate` pulses at the threshold and on success, if present. |
| `disabled`          | `boolean`                                       | `false`                  | View-only: rows stay readable and focusable, nothing can be triaged.          |
| `disabledReason`    | `string`                                        | View-only sentence       | Notice shown when disabled.                                                   |
| `emptyActionLabel`  | `string`                                        | `"View archived alerts"` | The empty state's one action.                                                 |
| `forceState`        | `"active" \| "loading" \| "error" \| "success"` | none                     | Freezes one moment of the gesture for previews and visual tests.              |
| `onArchive`         | `(item) => void \| Promise<void>`               | none                     | Runs on archive. Return a promise for the loading state; reject for an error. |
| `onDelete`          | `(item) => void \| Promise<void>`               | none                     | Same for delete. A rejected `Error`'s message is shown inline.                |
| `onUndo`            | `(item, action) => void`                        | none                     | The user restored a row; reverse the action on your side.                     |
| `onComplete`        | `(item, action) => void`                        | none                     | The undo window closed; the action is final.                                  |
| `onChange`          | `(items) => void`                               | none                     | The visible list after every removal or restore.                              |
| `onEmptyAction`     | `() => void`                                    | none                     | Click handler for the empty state action.                                     |
| `className`         | `string`                                        | `""`                     | Extra classes on the root `<section>`.                                        |

`SwipeAlert` is `{ id: string; severity: "critical" | "warning" | "info"; service: string; region?: string; title: string; reading: string; age: string }`.

## Tokens

Reads `--iu-surface` (card and row faces), `--iu-background` (undo bar, notices, key caps), `--iu-border` (dashed row rules), `--iu-foreground` and `--iu-muted` (text), `--iu-accent` with `--iu-accent-foreground` (the archive panel, undo countdown and focus rings), `--iu-radius` (capped at 8px), `--iu-font` and `--iu-density` (row height). Delete and severity use semantic red and amber, always with a text label. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (drag, springs with release velocity, layout and presence) and `lucide-react` (archive, trash, loader, undo, lock, alert and bell icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/swipe-triage-alerts` (or copy `component.tsx` to `components/iloveui/swipe-triage-alerts.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Map your alerts (or messages, deployments, notifications) to `SwipeAlert` and pass them as `items`.
4. Pass `onDelete` and `onArchive` that call your API and return the promise; throw an `Error` with a human message when the server refuses, and it appears under the row with Retry.
5. Apply the action optimistically, reverse it in `onUndo`, and treat `onComplete` as the point of no return (for example, send the notification email or hard-delete there).
6. Use `disabled` for viewers without triage rights and `forceState` only in stories and visual tests.

## Customization ideas

- Rename the actions (`archiveLabel="Snooze"`, `deleteLabel="Resolve"`) for an incident queue.
- Lower `commitThreshold` to `0.3` on touch-first screens so a short flick is enough.
- Add a third, longer-swipe action by checking `Math.abs(x)` against a second threshold in `handleDragEnd`.
- Group rows by service with a sticky subheader per group; the swipe logic is per row and needs no change.
- Persist the undo bar across navigation by lifting `undo` state into your store.
