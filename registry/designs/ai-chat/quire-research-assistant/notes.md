# Quire research assistant

## Usage notes

- Use it for research and analysis assistants where trust matters more than speed: policy, market research, legal or scientific questions. It expects one question, a set of numbered sources with quoted passages, and an answer whose sentences carry citation numbers.
- From 896px of container width the sources sit in a 320px column beside the answer; narrower, they follow the answer. The headline, lead and figure scale down; the figure's numerals stack above its chart.
- Citations are disclosure buttons (`aria-expanded`, `aria-controls` pointing at the source) with names like "Source 1: Four days, same pay". The same source rows in the column toggle the same state, so readers can go from text to source or back. Each button is at least 24px and grows to 40px on touch.
- The depth selector is a select-only listbox (arrows, Home, End, Enter, Space, Tab chooses, Escape closes). Enter asks, Shift+Enter adds a line, Escape stops writing.
- A polite live region announces writing, stopped, copied, attached, removed and which source is shown. The answer is `aria-busy` while it is written; the credit meter is a `role="meter"` with a value text; the figure's chart has a full text alternative.
- States: default is a finished answer with source 1 open; loading writes mid-paragraph with Stop and a sentence counter; error stops after the figure with an "Answer incomplete" note and Retry the search.
- Motion is slow and quiet: words appear at a reading pace, the citation rule draws in 400ms, passages unfold over about 320ms. Writing pauses offscreen and is instant under reduced motion.

## Taste self-review

- One clear focal point: Yes. The open citation: an accent rule under its sentence and its quoted passage in the column, the only accent marks besides the figure's end value.
- Spacing on the 4px scale: Yes. Paddings and gaps are 4px multiples (8, 12, 16, 20, 24, 32, 40, 48px); source rows scale with `--iu-density`; the type scale is 11, 13, 16, 17, 18, 22, 26, 30, 34, 48, 56 and 72px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It treats sources with the care of a good publication: exact passages, locators, a method note and an honest incomplete state, with no chrome beyond rules and type.
- Meets its category brief: Yes. Streaming text with a caret and a sentence counter; an expandable tool-call block (Method, with queries and read counts); Copy with sources and Retry; a composer with attachments and a depth (model) selector; a research-credit meter; Stop with Escape.
- Distinct from every other design in its category: Yes. Relay is a dark ops console with result tables and Wren is a soft consumer chat; Quire is a single editorial answer page with inline citations wired to a sources column.
