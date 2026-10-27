# Hopscotch onboarding

## Component

`HopscotchOnboarding` is a four-step sign-up and onboarding card: Account (Google, GitHub or email with a password visibility toggle), Workspace (name with a live URL preview and a team-type pill group), Team (invite chips with inline validation and an empty state) and Preferences (template cards drawn in SVG and a digest switch). Progress is a row of numbered tiles joined by a dashed path; an accent token hops from tile to tile with a bouncy spring, finished tiles turn into checks you can click to go back, and a tilted sticker counts down the time left. Finishing shows loading dots inside the button, an error alert that keeps every answer, or a success view where the check draws itself and four small shapes pop out once.

## Props

| Prop            | Type                                          | Default            | Description                                                                                       |
| --------------- | --------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| `brand`         | `string`                                      | `"Hopscotch"`      | Product name in the header and copy.                                                              |
| `defaultStep`   | `0 \| 1 \| 2 \| 3`                            | `0`                | Step to open on, for resuming a half-finished setup.                                              |
| `defaultValues` | `Partial<HopscotchValues>`                    | empty, sprint plan | Prefilled answers (name, email, password, workspace, team, invites, template, mondayDigest).      |
| `status`        | `"idle" \| "loading" \| "error" \| "success"` | `"idle"`           | Controlled status for the final submit. Leave at `"idle"` to track the promise from `onComplete`. |
| `errorMessage`  | `string`                                      | Save failure copy  | Copy for the error alert on the last step.                                                        |
| `onComplete`    | `(values) => void \| Promise<void>`           | none               | Called on Finish setup. Reject with an `Error` to show its message.                               |
| `onSocial`      | `(provider: "google" \| "github") => void`    | none               | Start OAuth; the flow moves on to the workspace step.                                             |
| `onStepChange`  | `(step: number) => void`                      | none               | Track progress or sync the URL.                                                                   |
| `onOpenBoard`   | `() => void`                                  | none               | The success view's action.                                                                        |
| `className`     | `string`                                      | `""`               | Extra classes for the outer wrapper.                                                              |

## Tokens

Reads `--iu-surface` (card, inputs), `--iu-background` (template thumbnails), `--iu-foreground` (2px outlines, hard bottom shadows, done tiles), `--iu-muted` (helper text), `--iu-accent` (the hopping token, primary button, the card's offset shadow at 32% and the sticker tint), `--iu-accent-foreground` (text on accent), `--iu-radius` (floored at 14 to 24px), `--iu-font` and `--iu-density` (step padding and field gaps). Errors use semantic red with an icon.

## Dependencies

`react`, `motion` (token hop, step slides, chip pops, the switch thumb and the drawn check) and `lucide-react` (arrows, check, eye, plus, close and alert icons). Google and GitHub marks are inline SVG. Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/hopscotch-onboarding` (or copy `component.tsx` into your components folder).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<HopscotchOnboarding onComplete={createAccountAndWorkspace} />` on your `/welcome` route inside a centered column.
4. If the user already signed in with OAuth, pass `defaultStep={1}` and their `name` and `email` in `defaultValues`.
5. In `onComplete`, create the account, the workspace and the invites in one request and return its promise; throw an `Error` with friendly copy if the workspace URL is taken.
6. Route to the new board in `onOpenBoard`.

## Customization ideas

- Replace the template cards with plan choices and move billing into the last step.
- Add a fifth step for connecting Slack or Google Calendar; the progress row adapts if you extend `STEPS`.
- Persist answers on every `onStepChange` so people can leave and resume.
- Swap the sticker's minutes for a real estimate based on the fields left.
- Drop the card shadow tint to the foreground for a monochrome variant.
