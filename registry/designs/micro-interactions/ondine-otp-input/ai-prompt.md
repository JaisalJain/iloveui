# Ondine OTP input

## Component

`OndineOtpInput` is a verification-code step for sign-in, payouts or device approval, set in a quiet luxury register: a double-ruled panel, a wide-tracked label, a serif headline and six serif numerals sitting on hairlines. Typing advances to the next box, pasting or autofilling the whole code fills every box at once, Backspace walks back across boxes, and arrow keys, Home and End move between them. The focused box's hairline extends and takes the accent with a slow caret; each digit rises 6px into place. When the last digit lands the code is announced and verified: a quiet "Verifying" line, then the six hairlines retract and a single accent rule draws across the whole code with "Verified" in italic. A wrong code clears the boxes, nudges the row once (6px, no bounce), turns the hairlines red and explains what happened. A resend button counts down before it can send again.

## Props

| Prop               | Type                                                    | Default                     | Description                                                               |
| ------------------ | ------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `length`           | `number`                                                | `6`                         | Number of digits.                                                         |
| `eyebrow`          | `string`                                                | `"Ondine · Private client"` | Small tracked label at the top.                                           |
| `title`            | `string`                                                | `"Confirm it's"`            | Headline before the emphasised word.                                      |
| `titleEmphasis`    | `string`                                                | `"you"`                     | The italic word that ends the headline.                                   |
| `destination`      | `string`                                                | `"+44 ••••• ••0821"`        | Where the code went, already masked.                                      |
| `expiresInMinutes` | `number`                                                | `10`                        | Shown in the instructions.                                                |
| `resendSeconds`    | `number`                                                | `45`                        | Countdown before the code can be sent again.                              |
| `successMessage`   | `string`                                                | Welcome sentence            | Shown and announced on success.                                           |
| `errorMessage`     | `string`                                                | Mismatch sentence           | Shown when `onComplete` returns `false`; a thrown `Error`'s message wins. |
| `haptics`          | `boolean`                                               | `true`                      | `navigator.vibrate` on success and a double pulse on error, if present.   |
| `disabled`         | `boolean`                                               | `false`                     | Locks the inputs and the resend button.                                   |
| `disabledReason`   | `string`                                                | Lockout sentence            | Shown when disabled.                                                      |
| `forceState`       | `"active" \| "loading" \| "error" \| "success"`         | none                        | Freezes a state for previews and visual tests.                            |
| `onComplete`       | `(code) => void \| boolean \| Promise<void \| boolean>` | none                        | Verify the code. Resolve to accept; return `false` or throw to reject.    |
| `onChange`         | `(code) => void`                                        | none                        | Every change, with the digits entered so far.                             |
| `onResend`         | `() => void`                                            | none                        | Send a new code.                                                          |
| `className`        | `string`                                                | `""`                        | Extra classes on the root `<section>`.                                    |

## Tokens

Reads `--iu-surface` (panel), `--iu-border` (the double rule and dividers), `--iu-foreground` (numerals, filled hairlines, caret), `--iu-muted` (labels and instructions), `--iu-accent` and `--iu-accent-foreground` (the short rule under the label, the focused hairline, the joined success rule, the check and focus rings), `--iu-radius` (capped at 2px for the panel; the resend button is a full pill), `--iu-font` and `--iu-density` (panel padding). Numerals use your `font-serif`. Errors use semantic red with text. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (digit entrances, hairline extensions, the joined rule and the error nudge) and `lucide-react` (loader and check). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/ondine-otp-input` (or copy `component.tsx` to `components/iloveui/ondine-otp-input.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`) and that `font-serif` maps to a serif you like.
3. Pass `destination` already masked by your server, never the full number or address.
4. In `onComplete`, call your verify endpoint and return `true` or `false` (or throw an `Error` with a human message, such as "This code has expired."). Navigate on success.
5. Wire `onResend` to your send endpoint, set `resendSeconds` to your rate limit, and pass `disabled` with a `disabledReason` after too many attempts.
6. Keep the first box's `autocomplete="one-time-code"` so iOS and Android offer the code from messages.

## Customization ideas

- Use `length={4}` for a card PIN or `length={8}` for a backup code; the visual gap moves to the middle automatically.
- Swap the masked phone for an email address and the resend button for "Open mail".
- Add a "Use another method" text link under the resend button for authenticator apps.
- Show the digits as dots for a PIN by rendering `•` in the overlay instead of the digit.
- Set `titleEmphasis` to the client's first name for a returning-member greeting.
