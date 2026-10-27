# Redaction reveal headline

## Component

`RedactionRevealHeadline` is a full-width neo-brutalist section built around one statement set at display size. The phrases marked `redact: true` render under solid redaction bars after mount; as each phrase crosses the reading line (68% down the viewport) its bars lift word by word in four hard steps and collapse into an accent underline. Bars lift once and never come back, even when the reader scrolls up. Below the statement sit a short paragraph, one primary action and three receipt blocks with oversized figures. The server markup shows the statement fully readable, so the text never depends on JavaScript; under reduced motion no bar is drawn and the accent underlines are shown straight away.

## Props

| Prop         | Type                 | Default                                 | Description                                                               |
| ------------ | -------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `brand`      | `string`             | `"Hushmark Analytics"`                  | Name in the top rule.                                                     |
| `issue`      | `string`             | `"Privacy ledger · rev 07"`             | Mono label at the right of the top rule.                                  |
| `sticker`    | `string`             | `"Audited 14 Mar 2026"`                 | Rotated sticker beside the statement.                                     |
| `statement`  | `RedactionPart[]`    | Cookie, fingerprint and IP promise      | The headline as parts; parts with `redact: true` get bars and underlines. |
| `body`       | `string`             | One sentence about the script and audit | Supporting paragraph.                                                     |
| `ctaLabel`   | `string`             | `"Read the script"`                     | Label of the only primary action.                                         |
| `ctaHref`    | `string`             | `"#script"`                             | Where the action goes.                                                    |
| `receipts`   | `RedactionReceipt[]` | Three zero-count receipts               | Blocks under the statement: `{ value, label, detail }`.                   |
| `onRevealed` | `() => void`         | none                                    | Called once after the last bar has lifted (useful for analytics).         |
| `className`  | `string`             | `""`                                    | Extra classes for the `<section>`.                                        |

`RedactionPart` is `{ text: string; redact?: boolean }`.

## Tokens

Reads `--iu-background` (section), `--iu-surface` (sticker and receipt blocks), `--iu-foreground` (2px outlines, redaction bars and hard shadows; shadows soften to a 42% mix in dark mode), `--iu-muted` (labels and detail text), `--iu-accent` (the underline each bar collapses into, the primary button fill, focus rings), `--iu-accent-foreground` (button text), `--iu-radius` (capped at 4px), `--iu-font` and `--iu-density` (receipt padding). Add them once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react` (the arrow in the button). The effect is CSS transitions on `transform` driven by one `IntersectionObserver`; no animation library. Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/redaction-reveal-headline` (or copy `component.tsx` to `components/iloveui/redaction-reveal-headline.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens` adds them).
3. Render `<RedactionRevealHeadline />` below your hero and pass your own `statement`, keeping at most three redacted phrases so each one lands.
4. Point `ctaHref` at the page that proves the claim (a policy, an audit, the source).
5. Replace `receipts` with figures you can back up; keep three so the row stays even on tablets.
6. Optionally pass `onRevealed` to log that a visitor read the whole statement.

## Customization ideas

- Use it for a security page: redact "plaintext passwords", "shared admin keys" and "unencrypted backups".
- Turn it into a changelog headline where the redacted phrase is the feature name revealed at launch.
- Drop the receipts and center a single huge statement for a manifesto page.
- Raise `--iu-density` to 1.2 for roomier receipt blocks on marketing pages.
- Swap the accent underline for a 2px foreground strike-through to reveal things you stopped doing.
