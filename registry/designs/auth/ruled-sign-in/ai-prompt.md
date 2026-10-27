# Ruled sign-in

## Component

`RuledSignIn` is a full-screen sign-in and sign-up page on a strict 12-column grid. The left columns hold the headline and an indexed list of trust facts; the right columns hold one ruled panel with two tabs (Sign in, Create account), Google and GitHub buttons, and an email form. Fields validate inline on blur and on submit, the password has a visibility toggle, and in sign-up mode a 12-tick ruler fills one tick per character while three indexed rules (length, number, symbol) tick off as they are met. Submitting shows a loading button that keeps its width, an error banner, or a success panel (Welcome back, or Check your inbox).

## Props

| Prop               | Type                                             | Default           | Description                                                                                               |
| ------------------ | ------------------------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------- |
| `defaultMode`      | `"sign-in" \| "sign-up"`                         | `"sign-in"`       | Which tab opens first.                                                                                    |
| `defaultValues`    | `Partial<{ name; email; password }>`             | empty             | Prefilled values, for example an email from an invite link.                                               |
| `brand`            | `string`                                         | `"Tessel"`        | Product name used in the wordmark, headlines and success copy.                                            |
| `facts`            | `{ label: string; value: string }[]`             | Three trust facts | The indexed list beside the form on wide screens.                                                         |
| `status`           | `"idle" \| "loading" \| "error" \| "success"`    | `"idle"`          | Controlled status. Leave at `"idle"` and return a promise from `onSubmit` to let the component manage it. |
| `errorMessage`     | `string`                                         | Mismatch message  | Copy for the error banner.                                                                                |
| `onSubmit`         | `(values, mode) => void \| Promise<void>`        | none              | Called with trimmed values once every field is valid. Reject with an `Error` to show its message.         |
| `onModeChange`     | `(mode) => void`                                 | none              | Called when the tab changes, for syncing the URL (`/sign-in`, `/sign-up`).                                |
| `onSocial`         | `(provider: "google" \| "github", mode) => void` | none              | Start the OAuth flow.                                                                                     |
| `onForgotPassword` | `(email: string) => void`                        | none              | Open your reset flow with the typed email.                                                                |
| `onSso`            | `() => void`                                     | none              | SAML link in sign-in mode, join-team link in sign-up mode.                                                |
| `onContinue`       | `() => void`                                     | none              | The Open workspace button after signing in.                                                               |
| `onResend`         | `(email: string) => void`                        | none              | The Resend email button after signing up.                                                                 |
| `className`        | `string`                                         | `""`              | Extra classes for the `<section>`.                                                                        |

## Tokens

Reads `--iu-background` (page and inputs), `--iu-surface` (the panel), `--iu-border` (grid rules, list rules), `--iu-foreground` (text, the primary button fill, filled ruler ticks, control borders at 35%), `--iu-muted` (labels and secondary text), `--iu-accent` (the active-tab marker, the success mark and focus rings only), `--iu-accent-foreground` (the check on the success mark), `--iu-radius` (capped at 6px), `--iu-font` and `--iu-density` (panel padding and field spacing). Errors use semantic red with an icon.

## Dependencies

`react`, `motion` (the headline cross-fade and the sliding tab marker) and `lucide-react` (eye, check, alert, arrow and loader icons). The Google and GitHub marks are inline SVG. Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/ruled-sign-in` (or copy `component.tsx` into your components folder).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<RuledSignIn />` on your `/sign-in` page and pass `defaultMode="sign-up"` on `/sign-up`; use `onModeChange` to keep the URL in sync.
4. In `onSubmit`, call your auth API and return the promise. Throw `new Error("...")` with user-facing copy for wrong credentials or a taken email.
5. Wire `onSocial` to your OAuth redirects, `onForgotPassword` to your reset page, and `onContinue` to a router push. Keep the password rules in sync with your server's policy.

## Customization ideas

- Swap GitHub for Microsoft or Apple by adding a mark and a provider value.
- Replace the trust facts with the workspace the invite came from: its name, owner and member count.
- Add a fourth password rule (no part of the email) and widen the ruler to 16 ticks.
- Tie the success panel to a magic-link flow and hide the password field entirely.
- Set `--iu-density` to 0.8 for an embedded modal version of the panel.
