# Kettle CTA and footer

## Component

`KettleCtaFooter` closes a landing page in the playful family: a call-to-action card with a 2px outline and a chunky offset shadow (foreground in light mode, accent-tinted in dark mode), a bold headline, one pill action that wiggles once on hover and presses into its shadow, and a sticker collage that shows the product (this week's five dinners, a shopping-list total and a "4 min to plan" badge). Below it, a footer with the brand mark, a newsletter form and four columns of real links, then a legal line and social links. The newsletter field has five states: idle; invalid (red outline, an inline message, a quick shake of the button); loading (a spinner inside a button that keeps its width); success (the row becomes a card and a check draws itself inside an accent circle); and error (an honest message that keeps the email so the visitor can retry).

## Props

| Prop               | Type                                                       | Default                                         | Description                                                           |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| `headline`         | `string`                                                   | `"Dinner's sorted. All week."`                  | CTA headline.                                                         |
| `subline`          | `string`                                                   | Product sentence                                | Supporting paragraph.                                                 |
| `ctaLabel`         | `string`                                                   | `"Plan this week"`                              | Label of the one action.                                              |
| `ctaHref`          | `string`                                                   | `"#plan"`                                       | Where the action goes.                                                |
| `meals`            | `KettleMeal[]`                                             | Five dinners                                    | Rows of the week sticker (`{ day, dish, minutes }`).                  |
| `shoppingSummary`  | `string`                                                   | `"23 items · £41.80"`                           | Text on the shopping-list sticker.                                    |
| `brand`            | `string`                                                   | `"Kettle"`                                      | Wordmark beside the SVG mark.                                         |
| `tagline`          | `string`                                                   | Brand line                                      | Line under the wordmark.                                              |
| `newsletterTitle`  | `string`                                                   | `"The Sunday shortlist"`                        | The field's visible label.                                            |
| `newsletterHelper` | `string`                                                   | Frequency and unsubscribe line                  | Helper text linked to the field.                                      |
| `linkGroups`       | `KettleLinkGroup[]`                                        | Product, Recipes, Company, Help                 | Footer columns (`{ title, links: { label, href }[] }`).               |
| `legal`            | `string`                                                   | `"© 2026 Kettle Kitchen Ltd · Made in Bristol"` | Legal line in the bottom bar.                                         |
| `status`           | `"idle" \| "invalid" \| "loading" \| "success" \| "error"` | unset                                           | Forces a newsletter state; leave unset to let the form manage itself. |
| `defaultEmail`     | `string`                                                   | `""`                                            | Initial value of the field.                                           |
| `onSubscribe`      | `(email: string) => Promise<void> \| void`                 | none                                            | Called with a valid email; resolve for success, reject for error.     |
| `onCtaClick`       | `() => void`                                               | none                                            | Called when the action is clicked.                                    |
| `className`        | `string`                                                   | `""`                                            | Extra classes for the root element.                                   |

## Tokens

Reads `--iu-background` (page), `--iu-surface` (stickers, field, success card), `--iu-foreground` (outlines, offset shadows in light mode, the Subscribe button, the round badge), `--iu-muted` (helper text, links), `--iu-accent` (the CTA button, the card tint at 10 to 16 percent, the backdrop circle, the first day, the success circle, dark-mode shadows and focus rings), `--iu-accent-foreground` (text and the check on accent), `--iu-radius` (floored at 16 to 28px), `--iu-font` and `--iu-density` (sticker row spacing). `--iu-border` is not needed: every edge is a 2px foreground outline. Error text and the invalid outline use red with an icon and a message. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the hover wiggle, the shake, the success card spring and the drawn check) and `lucide-react` (arrow, spinner and alert icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/kettle-cta-footer` (or copy `component.tsx` to `components/iloveui/kettle-cta-footer.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS.
3. Render `<KettleCtaFooter />` at the end of your layout and pass your `headline`, `ctaLabel`, `ctaHref`, `brand` and `linkGroups`.
4. Pass `onSubscribe={async (email) => { const res = await fetch("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) }); if (!res.ok) throw new Error("Failed"); }}`. A resolved promise shows success; a thrown error shows the error state and keeps the email.
5. Replace `meals` and `shoppingSummary` with content from your own product so the stickers show what it really does.

## Customization ideas

- Swap the week sticker for your product's equivalent: a streak calendar, a playlist or a packing list.
- Drop the backdrop circle and tint the whole page with the accent at 6 percent for a calmer footer.
- Add a fifth link column for regional sites on wide screens with `lg:grid-cols-5` on the nav.
- Use `status="success"` server-side after a double-opt-in redirect to show the confirmation card.
- Replace the round badge with a real figure from your product, such as recipes added this week.
