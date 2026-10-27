# Kettle CTA and footer

## Usage notes

- Use it as the closing block of a consumer product's landing page: one call to action, then the site footer. The stickers show the product's actual output, a week of dinners and a shopping list, rather than a decorative illustration.
- The newsletter field has a visible label and helper text linked with `aria-describedby`; invalid and error messages are added to that description, announced through a polite live region and paired with an icon, and the field gets `aria-invalid`. Validation runs on submit, then clears as soon as the email becomes valid.
- Loading disables the field and button, marks the button `aria-busy` and swaps its label for a spinner without changing its width. Success replaces the row with a confirmation card; error keeps the typed email.
- Motion is on interaction only: one wiggle when the pointer reaches the action, a press into its shadow, a short shake for an invalid email and a check that draws itself on success. Under reduced motion all of it is instant or off and the spinner stops.
- Link columns are a labelled `nav` with real headings; links have 32px targets (40px on touch). The stickers are hidden from assistive technology because the CTA text already says what they show.

## Taste self-review

- One clear focal point: Yes. The heavy headline and the accent pill in the outlined card; everything else is quieter neutrals.
- Spacing on the 4px scale: Yes. Gaps and paddings use 8, 12, 16, 20, 28, 40, 48 and 64px; sticker rows scale from 6px with density, and shadows are 4px and 8px offsets.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is loud in a disciplined way: one accent, one tint, consistent 2px outlines and offset shadows, and fully specified form states.
- Meets its category brief: Yes. One action in the CTA, a footer with four real link groups and a legal bar, and a newsletter field with idle, invalid, loading, success and error states.
- Distinct from every other design in its category: Yes. It is the first design in the category and sets the playful sticker-collage pattern; later designs must avoid it.
