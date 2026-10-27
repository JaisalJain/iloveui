# Commonplace editorial bento

## Usage notes

- Use it as the features section of a reading app, research tool, publication or knowledge base. It is a full-width section and reads like a magazine spread: masthead, headline, then four numbered features in reading order.
- Each passage has a 24px round toggle (40px on touch) that is a real `aria-pressed` button named "File passage 2: …" or "Remove passage 2: …"; clicking the passage text does the same for pointer users. The notebook is a labelled `aside` and its count is a polite live region, so filing is announced once.
- The empty notebook explains what will appear there and offers one action: file the first passage. The copy button confirms with "Copied" in place.
- Footnote markers in the Ask feature are real `sup` elements matched to a numbered source list; the reading queue is an ordered list whose dot leaders are decorative.
- Layout: one column at 375px (article, notebook, then the three features), the Ask and Queue features side by side at 768px, and at 1024px a 7 and 5 column lead with features at 5, 4 and 3 columns divided by vertical rules.
- Motion: the underline draws across every wrapped line in 400ms, notebook entries rise 8px and fade in 320ms. Both are instant under reduced motion. Nothing loops.

## Taste self-review

- One clear focal point: Yes. The lead feature's article page is the only framed surface on the spread, and the accent underlines in it are the only color, drawing the eye from the marked text to the notebook beside it.
- Spacing on the 4px scale: Yes. Column gaps are 24 and 32px, section rules sit 56 to 80px apart, notebook rows use 20px times density and every inner gap is 4, 8, 12, 16 or 20px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It has the restraint of a well-set publication: two families, a double-ruled masthead, citations in small mono and a single accent mark, with controls that behave like a real notes product.
- Meets its category brief: Yes. Four features in four sizes (a full-width lead split 7 and 5, then 5, 4 and 3 columns) read in numbered order, and each proves its feature with a mini UI: passage filing with citations, a footnoted answer, a contents-page queue and a resurfaced quote card.
- Distinct from every other design in its category: Yes. It is the only editorial, rule-based bento and the only one whose interaction moves content from one cell into another; the swiss, soft tactile and data-dense bentos use a slider, toggles and a shared time cursor instead.
