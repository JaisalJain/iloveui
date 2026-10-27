# Shunt landing page

## Component

`ShuntLandingTemplate` is a complete neo-brutalist landing page for a developer product (the demo brand is Shunt, a background job queue). In order: a sticky header with a modal mobile menu, a hero with an oversized headline, one primary action, an enqueue snippet and a live queue board (a failed job can be retried and walks its four-block rail to Done), four product cells (command palette, retry backoff, hold-to-purge, hourly throughput), a guarantee statement whose key phrases lift out from under redaction bars as they are read, three customer receipts with before and after numbers, three pricing slabs with a monthly/yearly switch and checkout states, an FAQ, a sign-up block with an email field and a footer with four link columns.

## Props

| Prop             | Type                                            | Default                                    | Description                                                                             |
| ---------------- | ----------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `brand`          | `string`                                        | `"Shunt"`                                  | Product name in the header, mobile menu and footer wordmark.                            |
| `anchorPrefix`   | `string`                                        | `"shunt"`                                  | Prefix of the section ids (`-top`, `-product`, `-proof`, `-pricing`, `-faq`, `-start`). |
| `nav`            | `ShuntLink[]`                                   | Five links                                 | Header and mobile menu links.                                                           |
| `signInHref`     | `string`                                        | `"#sign-in"`                               | Sign in link.                                                                           |
| `announcement`   | `string`                                        | `"New · Cron lanes in v3.2"`               | Sticker above the headline.                                                             |
| `headline`       | `string`                                        | `"Every background job, out in the open."` | The one message, under 10 words.                                                        |
| `headlineMark`   | `string`                                        | `"out in the open"`                        | Words of the headline that get the accent underline.                                    |
| `subline`        | `string`                                        | Product sentence                           | Text under the headline.                                                                |
| `ctaLabel`       | `string`                                        | `"Start free"`                             | The primary action, used in the header, menu and hero.                                  |
| `ctaHref`        | `string`                                        | `"#shunt-start"`                           | Where the primary action goes.                                                          |
| `ctaNote`        | `string`                                        | Free plan note                             | Quiet line under the hero action.                                                       |
| `jobs`           | `ShuntJob[]`                                    | Five jobs                                  | Rows of the queue board. One `failed` job gets Retry.                                   |
| `doneToday`      | `number`                                        | `48213`                                    | Counter on the board; rises as jobs finish.                                             |
| `proofs`         | `ShuntProof[]`                                  | Three receipts                             | Customer evidence: metric, before, after, quote, person, source.                        |
| `plans`          | `ShuntPlan[]`                                   | Hobby, Team, Scale                         | Pricing slabs; exactly one `highlighted`.                                               |
| `savingLabel`    | `string`                                        | `"Save 20%"`                               | Sticker on the billing switch.                                                          |
| `faqs`           | `ShuntFaq[]`                                    | Six questions                              | FAQ items; the first is open.                                                           |
| `footerColumns`  | `ShuntFooterColumn[]`                           | Four columns                               | Footer link structure.                                                                  |
| `checkoutStatus` | `"idle" \| "loading" \| "error" \| "success"`   | unset                                      | Controls the checkout state of the highlighted plan.                                    |
| `onCheckout`     | `(planId, billing) => void \| Promise<unknown>` | unset                                      | Called by plan buttons; return a promise to let the page track the state.               |
| `signupStatus`   | `"idle" \| "loading" \| "error" \| "success"`   | unset                                      | Controls the sign-up form.                                                              |
| `defaultEmail`   | `string`                                        | `""`                                       | Initial value of the email field.                                                       |
| `onSignup`       | `(email) => void \| Promise<unknown>`           | unset                                      | Called with a valid email; return a promise to track loading and errors.                |
| `onRetryJob`     | `(jobId) => void`                               | unset                                      | Called when Retry is pressed on the board.                                              |
| `onPurge`        | `() => void`                                    | unset                                      | Called when the hold-to-purge completes.                                                |
| `className`      | `string`                                        | `""`                                       | Extra classes for the page root.                                                        |

## Tokens

Reads `--iu-background` (page), `--iu-surface` (boxes, slabs, inputs), `--iu-foreground` (2px outlines, hard shadows, ink fills and text), `--iu-muted` (secondary text), `--iu-border` (the grid lines behind the sign-up block), `--iu-accent` and `--iu-accent-foreground` (primary buttons, the running rail block, the highlighted plan band, underlines and focus rings), `--iu-radius` (capped at 4px), `--iu-font` and `--iu-density` (row and cell padding). In dark mode the hard shadows switch to a softened ink so they read as structure, not glare. Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (rail fills, stamped stickers, the hold fill) and `lucide-react` (icons). Tailwind CSS 4.1 or later. `font-mono` should map to a monospace face such as JetBrains Mono.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/shunt-landing-template` (or copy `component.tsx` to `components/iloveui/shunt-landing-template.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<ShuntLandingTemplate />` as the whole page (it includes its own header, `main` and footer). Replace `brand`, `headline`, `subline`, `nav`, `plans`, `faqs`, `proofs` and `footerColumns` with your product's content.
4. Wire `onCheckout` to your payment provider: return the promise that opens checkout so the button shows loading, an error box with Retry, then the confirmation. Pass `checkoutStatus` instead if your app owns that state.
5. Wire `onSignup` to your sign-up endpoint the same way; the field validates the address before calling it.
6. Feed `jobs` from a real snapshot of your product (or replace the board with your own product visual of the same size) and keep exactly one primary action in the hero.

## Customization ideas

- Swap the queue board for another product snapshot (a deploy log or an order list) and keep the rail-and-sticker pattern.
- Remove Hobby and make the page a two-plan comparison with an Enterprise contact row.
- Replace the guarantee phrases with your product's three strongest promises; each redacted phrase lifts on its own.
- Change `--iu-accent` to your brand color; the page keeps it to buttons, one rail block and the highlighted plan.
- Set `--iu-density` to 0.8 for a denser board and FAQ on documentation-style pages.
