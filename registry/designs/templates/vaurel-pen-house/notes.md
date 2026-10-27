# Vaurel pen house

## Usage notes

- A complete home page for a premium maker that sells a few considered objects and a service around them: fountain pens here, but the structure fits watches, knives, cameras or leather goods. One brand runs through every section: Vaurel, a pen atelier in Lyon.
- Sections and where they come from in the catalog:
  - Storefront header: adapted from `hesper-storefront-nav` (navigation). Announcement line, centered serif wordmark, a Pens disclosure panel whose drawing changes to the piece under the pointer or keyboard focus, account and bag buttons, and a modal drawer below 1024px. New here: the drawer is a native `<dialog>`.
  - Hero: adapted from `private-office-hero` (hero) for the message column and from `atelier-product-page` (ecommerce) for the fine-line product drawing. New: the nib test sheet, the page's signature moment.
  - Collection grid: adapted from `verelle-cards` (cards-buttons) and the stock states of `atelier-product-page`: double-framed drawings, Only N left with an accent mark, a sold-out piece with its restock date, and Add to bag that keeps its width.
  - Craft story: new connective section with large serif numerals and an annotated nib drawing.
  - Nib service: adapted from `orsolo-membership` (pricing): the gliding double frame with its accent diamond, here moving between three services.
  - Journal: new connective section with honest editorial entries; no reviews, ratings or press quotes.
  - Newsletter: the success rule is adapted from `ondine-otp-input` (micro-interactions), where the hairlines join into one accent rule.
  - Footer: new, with four link groups, the atelier address and hours, and the legal row.
- Signature moment: the nib grades are a native radio group (one tab stop, arrow keys move and select). Choosing a grade rewrites the tuner's test loops from left to right at that line width (1.2s) and updates the caption; a polite live region reads "Broad nib, 0.80 millimetre line". Under reduced motion the new line appears at once.
- Keyboard: the Pens button carries `aria-expanded`; Enter or Space toggles it, Arrow Down opens it and focuses the first link, Arrow Up and Down, Home and End move through links, Escape closes and returns focus, and focus leaving the panel closes it. The drawer traps focus as a modal dialog, closes on Escape, the scrim or the close button, and returns focus to the menu button.
- The newsletter field has a visible label, a helper line that becomes the error (with `aria-invalid` and an icon), a loading state that keeps the button's width and draws an accent line under the field, an honest network error with Try again, and a success note that takes focus.
- States: default, loading, error and success are the newsletter's states (`newsletterStatus`). Leave the prop undefined and pass `onSubscribe` to let the component run the flow; a rejected promise shows the error.
- Responsive: one column at 375px with the message before the test sheet, collection cards in one, two and four columns, service rows stacked on phones with the frame on the chosen row, and the footer in two then six columns. `--iu-density` sets craft rows, panel links and footer link spacing.

## Taste self-review

- One clear focal point: Yes. The test sheet in the hero: the product drawn in profile above the line it writes, and the only motion on the page that runs on its own is that line being rewritten when you pick a nib.
- Spacing on the 4px scale: Yes. Section padding 80 and 112px, gaps of 24, 40 and 56px, card padding 4px between the double frames, rows scaled from 24px by the density token.
- Belongs in a Linear, Stripe or Vercel product: Yes. It has the restraint those teams bring to their own marketing pages: one serif, fine rules, one accent used only as a line or a mark, and an interactive product demo in place of a picture.
- Meets its category brief: Yes. It is a complete page assembled from six luxury catalog designs (navigation, hero, ecommerce, cards, pricing, micro-interactions), each rebranded and recopied for Vaurel, joined by new craft, journal and footer sections, all in the Luxury family.
- Distinct from every other design in its category: Yes. It is the catalog's luxury brand home page and the only template whose hero demonstrates the product's output (a pen's line) live.
