# Longhand reading questionnaire

## Component

`LonghandReadingOnboarding` is a personalization questionnaire for a reading or learning product, set like a magazine. A contents rail lists five chapters with roman numerals and folios (an accent rule marks the current one; answered chapters are links back). Each of the four questions is a large serif headline over answer lines in serif type with letter indexes; choosing a line draws an accent underline from left to right. The fifth chapter is the plan: a drop-cap paragraph written from the answers, three first reads with bylines and minutes, and a sign-up column (Google, Apple, or email with a password visibility toggle) to keep the plan. Saving shows a loading button, an error line, or an Issue No. 1 masthead.

## Props

| Prop             | Type                                                      | Default      | Description                                                                        |
| ---------------- | --------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------- |
| `brand`          | `string`                                                  | `"Longhand"` | Masthead name.                                                                     |
| `defaultStep`    | `0 \| 1 \| 2 \| 3 \| 4`                                   | `0`          | Chapter to open on; 4 is the plan and save step.                                   |
| `defaultAnswers` | `Partial<LonghandAnswers>`                                | empty        | `{ topics, time, length, challenge }` to resume a half-finished survey.            |
| `defaultEmail`   | `string`                                                  | `""`         | Prefilled email.                                                                   |
| `status`         | `"idle" \| "loading" \| "error" \| "success"`             | `"idle"`     | Controlled save status. Leave at `"idle"` to track the promise from `onSave`.      |
| `errorMessage`   | `string`                                                  | Save failure | Copy for the error line.                                                           |
| `onSave`         | `(answers, { email, password }) => void \| Promise<void>` | none         | Create the account and store the plan. Reject with an `Error` to show its message. |
| `onSocial`       | `(provider: "google" \| "apple", answers) => void`        | none         | Start OAuth carrying the answers.                                                  |
| `onStepChange`   | `(step: number) => void`                                  | none         | Persist progress or sync the URL.                                                  |
| `onOpenIssue`    | `() => void`                                              | none         | The saved masthead's Read a preview button.                                        |
| `className`      | `string`                                                  | `""`         | Extra classes for the wrapper.                                                     |

The topics, hours, lengths, challenge levels and reading list are constants at the top of the file; edit them to fit your catalog.

## Tokens

Reads `--iu-surface` (the page), `--iu-border` (answer rules, contents divider), `--iu-foreground` (ink, double rules, the primary pill), `--iu-muted` (kickers, unchosen answers, bylines), `--iu-accent` (the answer underline, the contents marker, the drop cap and focus rings), `--iu-radius` (capped at 2px for square frames), `--iu-font` (body and controls) and `--iu-density` (answer line height and padding). Display type uses `font-serif`, figures use `font-mono`. Errors use semantic red.

## Dependencies

`react`, `motion` (the drawn underline, the sliding contents marker and the courteous chapter fades) and `lucide-react` (arrows, eye, loader and alert icons). Google and Apple marks are inline SVG. Tailwind CSS 4.1 or later with a serif family defined (`--font-serif`).

## Integration steps

1. Run `npx shadcn@latest add @iloveui/longhand-reading-onboarding` (or copy `component.tsx` into your components folder).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`) and that `font-serif` maps to a real serif.
3. Replace `TOPICS` and `READS` with your own subjects and editor's picks; keep each question to three to eight answers.
4. In `onSave`, create the account and the reading plan in one request and return the promise; throw an `Error` with friendly copy if the email is taken.
5. Wire `onSocial` to OAuth and store the answers in session storage or the OAuth state so they survive the redirect.

## Customization ideas

- Turn it into a course placement quiz: chapters become skills and the plan lists the first three lessons.
- Add a sixth chapter asking for format (audio or text) with a small waveform drawn in SVG.
- Let the plan paragraph cite the answers inline as underlined links that jump back to each chapter.
- Replace the price line with a gift option for buying the plan for someone else.
- Collapse the contents rail into a top table of contents on wide marketing pages.
