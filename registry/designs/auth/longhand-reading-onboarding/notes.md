# Longhand reading questionnaire

## Usage notes

- Use it as the first-run flow of a reading, newsletter or learning product where answers shape the content. It asks four questions, then shows the plan before asking for an account, so people see value before they sign up.
- Answers are native checkboxes (topics, at most three) and radios (the rest) with their labels set in serif; arrow keys move within a question and the focus ring wraps the whole line. Selecting a fourth topic explains the limit in a polite live region instead of failing silently.
- The contents rail is a `nav` whose current chapter has `aria-current="step"`; answered chapters are buttons that jump back. Below about 768px of container width the rail becomes a five-segment rule with a screen-reader label, and the chapter kicker carries the position.
- When the chapter changes, focus moves to the new headline. Email and password validate on blur and on save, errors are linked to their fields, and the password toggle has `aria-pressed`.
- Motion is slow and courteous (300ms fades of 8px and a drawn underline) and becomes instant under reduced motion.

## Taste self-review

- One clear focal point: Yes. Each chapter is one serif question at 40 to 56px; the only accent on the page is the underline under the answer you chose.
- Spacing on the 4px scale: Yes. Margins and paddings are 4px multiples (8, 12, 16, 20, 24, 32, 40, 48px) and answer lines scale from 14px of padding with the density token.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is restrained and typographic, with real structure (contents, folios, bylines) and a single clear action per chapter, the way a thoughtful product introduces itself.
- Meets its category brief: Yes. Google, Apple and email sign-up on the plan chapter, inline validation for answers and fields, a password visibility toggle, loading and error states on save, and progress shown by the contents rail, the mobile rule and the chapter kicker.
- Distinct from every other design in its category: Yes. It is the category's only questionnaire-first, editorial flow with typographic answers and a written plan; the others are a grid sign-in, a playful card onboarding and a technical two-factor setup.
