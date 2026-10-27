# Vaultline two-factor setup

## Component

`VaultlineTwoFactor` is a four-step sign-up and TOTP setup for a developer tool, designed dark-first. Step one is account creation (GitHub, Google or email with a password visibility toggle and inline validation). Step two shows a QR code drawn in SVG inside corner ticks, the manual key with a copy button and the algorithm, digits and period. Step three is a six-cell code field backed by one real input (paste and one-time-code autofill work) beside a stepped 30-tick countdown of the current code window; verifying shows a loading button, a coded error, or locks the cells one by one. Step four lists ten recovery codes in a file frame with Copy all, Download .txt and an acknowledgement that gates Finish. A session log beside the steps appends a timestamped line for each event.

## Props

| Prop              | Type                                                    | Default                | Description                                                                                                       |
| ----------------- | ------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `brand`           | `string`                                                | `"Vaultline"`          | Product name in the header, copy and download filename.                                                           |
| `defaultStep`     | `0 \| 1 \| 2 \| 3`                                      | `0`                    | Step to open on (account, scan, verify, recovery).                                                                |
| `defaultEmail`    | `string`                                                | `""`                   | Prefilled email.                                                                                                  |
| `secret`          | `string`                                                | Demo base32 key        | Shown for manual entry; seeds the QR drawing. Render a real QR from your otpauth URL in production if you prefer. |
| `backupCodes`     | `string[]`                                              | Ten codes              | Recovery codes for step four.                                                                                     |
| `defaultCode`     | `string`                                                | `""`                   | Prefilled digits for the verify step.                                                                             |
| `status`          | `"idle" \| "loading" \| "error" \| "success"`           | `"idle"`               | Controlled verify status; `"success"` opens the finished recovery step.                                           |
| `errorMessage`    | `string`                                                | Mismatch copy          | Copy shown after `E_TOTP_MISMATCH`.                                                                               |
| `windowSeconds`   | `number`                                                | `30`                   | Seconds left in the current code window on first render.                                                          |
| `log`             | `{ time; scope; text }[]`                               | Derived from the step  | Initial session log lines.                                                                                        |
| `onCreateAccount` | `({ email, password }) => void \| Promise<void>`        | none                   | Create the account; reject with an `Error` to show its message on the email.                                      |
| `onSocial`        | `(provider: "github" \| "google") => void`              | none                   | Start OAuth.                                                                                                      |
| `onVerify`        | `(code) => void \| boolean \| Promise<void \| boolean>` | none                   | Verify the TOTP code; reject or return `false` for the error state.                                               |
| `onCopy`          | `(what: "secret" \| "codes", value) => void`            | none                   | Called after copying (the component also writes to the clipboard).                                                |
| `onDownloadCodes` | `(codes) => void`                                       | Built-in .txt download | Replace the download behaviour.                                                                                   |
| `onFinish`        | `() => void`                                            | none                   | Called after the user confirms they saved the codes.                                                              |
| `className`       | `string`                                                | `""`                   | Extra classes for the wrapper.                                                                                    |

## Tokens

Reads `--iu-surface` (panel), `--iu-background` (log, code frames, inputs), `--iu-border` (dashed dividers), `--iu-foreground` (text, QR modules, filled countdown ticks), `--iu-muted` (mono labels), `--iu-accent` (current step, corner ticks, primary buttons, locked cells, the last five seconds of the window, focus rings), `--iu-accent-foreground`, `--iu-radius` (capped at 8px), `--iu-font` and `--iu-density` (step padding and field gaps). In dark mode the QR flips to dark modules on a light tile so it stays scannable. Errors use semantic red, the enforced status uses semantic green, both with text.

## Dependencies

`react`, `motion` (step fades and the stepped cell lock) and `lucide-react` (check, copy, download, eye, alert, loader, shield and arrow icons). GitHub and Google marks are inline SVG. Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/vaultline-two-factor` (or copy `component.tsx` into your components folder).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Create the account in `onCreateAccount`, then fetch a TOTP secret from your server and pass it as `secret` (and the issued `backupCodes`).
4. In `onVerify`, post the code to your server and return the promise; resolve `false` or throw for a wrong code. Never verify codes in the browser.
5. Pass `windowSeconds={30 - (Math.floor(Date.now() / 1000) % 30)}` so the countdown matches real authenticator apps.
6. In `onFinish`, mark two-factor as enforced and route to the dashboard.

## Customization ideas

- Add a WebAuthn option on step two (security key or passkey) as a second tab.
- Let users regenerate recovery codes from the same frame inside account settings.
- Stream real audit events from your server into `log`.
- Shorten the flow for existing users by starting at `defaultStep={1}`.
- Add an SMS fallback row under the manual key with its own verification.
