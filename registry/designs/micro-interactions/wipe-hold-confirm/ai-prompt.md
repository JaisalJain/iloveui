# Wipe hold to confirm

## Component

`WipeHoldConfirm` is a neo-brutalist danger-zone panel for wiping a managed laptop, confirmed by pressing and holding one slab button. While held, the button sinks into its hard shadow, the label switches to "Keep holding", a solid accent block slides in from the left carrying its own copy of the label (two opposite translations, no scaling or clipping) and a mono countdown ticks from 1.6s to 0.0s. Let go early and the block springs back out from its current speed; grab it again mid-drain and it resumes from where it is. A full hold sends the wipe: loading, then "Wipe queued" with the device sticker flipping to "Erase pending", or an error that resets for a retry. Space or Enter held works exactly like a pointer hold, Escape cancels, and assistive tech that sends a single click starts a full hold that Escape can cancel. A polite live region announces each step.

## Props

| Prop             | Type                                          | Default                           | Description                                                               |
| ---------------- | --------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `brand`          | `string`                                      | `"Bolthouse"`                     | Product name in the top bar.                                              |
| `device`         | `WipeDevice`                                  | Kofi Mensah's MacBook Pro         | `{ name, model, serial, os, lastSeen, location }`.                        |
| `consequences`   | `string[]`                                    | Three sentences                   | What the wipe does, listed above the control.                             |
| `labels`         | `Partial<WipeHoldLabels>`                     | See source                        | `idle`, `holding`, `retry`, `loading` and `success` button text.          |
| `holdDurationMs` | `number`                                      | `1600`                            | How long the hold takes to fill.                                          |
| `spring`         | `{ stiffness: number; damping: number }`      | `{ stiffness: 700, damping: 45 }` | Spring for the drain after an early release.                              |
| `errorMessage`   | `string`                                      | Did-not-answer sentence           | Shown and announced on error.                                             |
| `successMessage` | `string`                                      | Check-in sentence                 | Shown and announced on success.                                           |
| `status`         | `"idle" \| "loading" \| "error" \| "success"` | uncontrolled                      | Control the state yourself.                                               |
| `disabled`       | `boolean`                                     | `false`                           | Locks the control (dashed outline, lock icon) and shows `disabledReason`. |
| `disabledReason` | `string`                                      | Admin-only sentence               | Why the control is locked.                                                |
| `forceState`     | `"active"`                                    | none                              | Renders the mid-hold look for docs and previews.                          |
| `onChange`       | `(progress: number) => void`                  | none                              | Fill progress from 0 to 1 while filling and draining.                     |
| `onComplete`     | `() => void \| Promise<void>`                 | none                              | Called on a full hold. A promise drives loading, then success or error.   |
| `onCancel`       | `() => void`                                  | none                              | Called when a hold is released early.                                     |
| `className`      | `string`                                      | `""`                              | Extra classes for the panel.                                              |

## Tokens

Reads `--iu-foreground` (2px outlines, hard shadows, bullets), `--iu-surface` (panel and button), `--iu-background` (success sticker text), `--iu-accent` (the hold fill, the danger sticker, focus rings), `--iu-accent-foreground` (text on the fill), `--iu-muted` (labels), `--iu-radius` (capped at 4px), `--iu-font` and `--iu-density` (padding). Add them with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the hold fill, drain spring and countdown) and `lucide-react` (warning, spinner, check, retry and lock icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/wipe-hold-confirm` (or copy `component.tsx` into `components/iloveui/`).
2. Make sure the `--iu-*` tokens exist in your global CSS.
3. Map your device record to `device` and write `consequences` in your product's words.
4. Pass `onComplete={() => api.wipeDevice(id)}` returning a promise; reject it to show the retry state.
5. Pass `disabled` with a `disabledReason` for users without permission rather than hiding the panel.
6. Log `onCancel` if you want to know how often people back out.

## Customization ideas

- Reuse it for deleting a project or revoking every API key: change `device` to the resource and its stats.
- Scale `holdDurationMs` with the blast radius: 1s for a single file, 3s for an organisation.
- Replace the countdown with the number of records that will be removed, counting down as the fill grows.
- Add a typed confirmation field that unlocks the hold for the most dangerous actions.
- Put several hold slabs in a settings page's danger zone, each with its own consequences list.
