# Pillow workspace form

## Component

`PillowWorkspaceForm` is a single-card "Create your workspace" form for a team product, built in the soft tactile style. It collects a workspace name (with a live monogram and a live URL preview built from the name), team size (a segmented control of native radios with a sliding thumb), the user's role (a custom select that follows the WAI-ARIA select-only combobox pattern), a time zone (an editable combobox with type-ahead filtering, `aria-activedescendant`, Enter and Escape handling, a no-match state and UTC offsets computed for today with `Intl`) and an "Invite teammates by email" switch. Every field has a visible label and helper text; errors replace the helper, set `aria-invalid` and are wired through `aria-describedby`.

Fields rest as pressed-in wells and lift 1px out of the card when focused, with a deep edge that keeps 3:1 and a soft accent ring. The signature moment is the submit button: it presses in, collapses into a circle that holds a progress ring while `onSubmit` runs (the freed space shows what is happening), then pops back out as a check. Springs are encoded as CSS `linear()` curves sampled from stiffness 380 / damping 30, so there is no animation runtime; everything is instant under reduced motion and the ring pauses when offscreen.

## Props

| Prop             | Type                                                                                                             | Default                          | Description                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`          | `string`                                                                                                         | `"Create your workspace"`        | Card heading (rendered as `h2`).                                                                                                                                                 |
| `description`    | `string`                                                                                                         | One sentence about the workspace | Supporting line under the heading; also the form's accessible description.                                                                                                       |
| `domain`         | `string`                                                                                                         | `"wrenhouse.app"`                | Host shown in the live URL preview and the success line.                                                                                                                         |
| `submitLabel`    | `string`                                                                                                         | `"Create workspace"`             | Label of the only primary action.                                                                                                                                                |
| `teamSizes`      | `PillowTeamSize[]`                                                                                               | Five ranges from 1 to 200+       | Segments of the team size control. Two to six fit; `spoken` is what screen readers say instead of the numerals.                                                                  |
| `roles`          | `PillowRole[]`                                                                                                   | Six roles with hints             | Options of the role select. Type-ahead matches the start of `label`.                                                                                                             |
| `timeZones`      | `PillowTimeZone[]`                                                                                               | 36 cities ordered west to east   | Options of the time zone combobox. Search matches city, region, IANA name, `keywords` and the offset ("+5:30", "UTC-4").                                                         |
| `defaultValues`  | `Partial<PillowWorkspaceValues>`                                                                                 | Empty name, 2–10, invite on      | Starting values: `name`, `teamSize`, `role`, `timeZone` (IANA name) and `inviteByEmail`.                                                                                         |
| `errors`         | `PillowWorkspaceErrors`                                                                                          | `{}`                             | Errors to show on first render (`name`, `role`, `timeZone`, `form`), for example after a server round trip.                                                                      |
| `status`         | `"idle" \| "loading" \| "error" \| "success"`                                                                    | `"idle"`                         | Status on first render. After that the form manages it from `onSubmit`; remount with a new `key` to reset.                                                                       |
| `disabled`       | `boolean`                                                                                                        | `false`                          | Disables every control and flattens the material.                                                                                                                                |
| `disabledReason` | `string`                                                                                                         | none                             | Shown above the fields when `disabled` is set. Say why, and what to do instead.                                                                                                  |
| `autoFocus`      | `boolean`                                                                                                        | `false`                          | Focuses the workspace name on mount (without scrolling).                                                                                                                         |
| `onSubmit`       | `(values: PillowWorkspaceSubmission) => void \| PillowWorkspaceErrors \| Promise<void \| PillowWorkspaceErrors>` | none                             | Called with valid values plus `slug` and `url`. Resolve to finish with the check, resolve with field errors to show them, or throw to show the error's message under the button. |
| `className`      | `string`                                                                                                         | `""`                             | Extra classes for the root element (a container-query context).                                                                                                                  |

`PillowTeamSize` is `{ value: string; label: string; spoken: string }`, `PillowRole` is `{ value: string; label: string; hint: string }` and `PillowTimeZone` is `{ value: string; city: string; region: string; keywords?: string }`.

## Tokens

Reads `--iu-surface` (the card and lifted fields), `--iu-background` (dark-mode wells), `--iu-border` (card edge, URL preview, switch tile), `--iu-foreground` (text, the 3:1 control line at 50% in light and 40% in dark, the focus edge), `--iu-muted` (helper text, placeholders, offsets), `--iu-accent` (submit fill, switch track, selected checks, the focus ring and same-hue tints for wells, the monogram and the active option), `--iu-accent-foreground` (submit label, ring and check), `--iu-radius` (floored at 14px for fields and 24px for the card; pills stay pills), `--iu-font` and `--iu-density` (field height, card padding and field spacing). The component derives its own material from these on the root as `--pw-*` custom properties (well, lifted surface, line, tint, focus edge, ring, layered shadows and two springs), so a Theme Lab accent re-tints every surface. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react` (arrow, check, chevron, alert, globe and lock icons). No animation library: transitions and springs are CSS. Tailwind CSS 4.1 or later (it uses `@container`, `starting:`, `has-*`, `not-*` and named groups).

## Integration steps

1. Run `npx shadcn@latest add @iloveui/pillow-workspace-form` (or copy `component.tsx` to `components/iloveui/pillow-workspace-form.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens` adds them).
3. Render `<PillowWorkspaceForm domain="yourapp.com" onSubmit={createWorkspace} />` where onboarding starts. Pass `autoFocus` when it is the only thing on the page.
4. Implement `onSubmit` against your API with the `slug` it receives. Return `{ name: "That URL is taken. Try fernway-studio-lisbon." }` for a conflict (the field turns invalid and takes focus), throw an `Error` for anything unexpected (its message appears under the button), or resolve to show the success check, then navigate to the new workspace.
5. To pre-select the visitor's zone, read `Intl.DateTimeFormat().resolvedOptions().timeZone` on the client and pass it as `defaultValues.timeZone` when it is in your list. Starting values are read once on mount, so render the form after that value is known or give it a `key` that changes with it; reading the zone during server rendering would mismatch.
6. For server-rendered results (a form action that failed), pass `errors` and `status="error"` with the values the user sent as `defaultValues`.
7. When the user has no permission or no quota, render it with `disabled` and a `disabledReason` that names the fix instead of hiding the form.

## Customization ideas

- Replace the role select with a "What will you use it for?" select and swap the hints for template names.
- Add a slug field that unlocks when the user clicks the URL preview, keeping the live suggestion as its placeholder.
- Check availability as people type: debounce the slug in the name field's change handler, call your API and set the name error from the result, the same slot a conflict from `onSubmit` uses.
- Drop team size to three segments ("Just me", "Team", "Company") for a lighter onboarding and let `spoken` carry the ranges.
- Set `--iu-density` to 0.8 for a compact settings-page variant; fields shrink to 40px and the spacing tightens with them.
