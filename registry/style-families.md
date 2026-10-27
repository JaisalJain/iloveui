# Style families

Every design belongs to exactly one family and follows its definition below. A family is a complete point of view: how type is paired, how round corners are, what draws edges and depth, how color behaves and how things move. Every family reads the same ten `--iu-*` tokens, so a buyer's brand re-skins all eight while each keeps its character.

Radius ranges are written against the token so Theme Lab still moves them: `min(var(--iu-radius), 6px)` caps a family that must stay crisp, `max(var(--iu-radius), 16px)` floors one that must stay soft.

Across the full catalog every category uses at least four families.

---

## Swiss minimal

International Typographic Style for product UI. The grid is the decoration and whitespace is structure.

- **Type pairing.** `--iu-font` alone, in two or three weights (400, 500, 600). Display sizes track tight (`-0.035em`); small labels are 11–12px uppercase with `+0.08em` tracking. Figures are tabular. Mono appears only for data.
- **Radius.** `0` to `min(var(--iu-radius), 6px)`. Most surfaces are square; controls take the capped radius.
- **Borders and shadows.** 1px rules in `--iu-border` carry the layout: column rules, dividers, table lines. No shadows; separation comes from space and rules.
- **Color.** Monochrome surfaces with `--iu-foreground` type. The accent appears once per view as a signal: the primary action, an active marker or a single highlighted figure.
- **Motion.** 150–200ms ease-out on opacity and translations of 4px or less. No springs. Changing numbers cross-fade.
- **Signature details.** Flush-left headlines on a strict 12-column grid, index numbers (01, 02, 03), oversized numerals, captions set small and precise.
- **Avoid.** Centered compositions, pills everywhere, decoration that carries no information, more than one accent use per view.

## Editorial

Magazine and long-form thinking applied to interfaces: typographic contrast, hierarchy you can read aloud.

- **Type pairing.** `font-serif` (Instrument Serif in previews, the host's serif elsewhere) for display lines and pull quotes, often italic; `--iu-font` for body and controls; uppercase tracked kickers; optional drop caps.
- **Radius.** `0` to `min(var(--iu-radius), 2px)`. Frames and figures are square.
- **Borders and shadows.** Horizontal rules (single or double), column dividers, hairline frames around figures. No shadows.
- **Color.** Paper and ink: `--iu-surface` pages on `--iu-background`, `--iu-foreground` text. The accent is one editorial mark: a rule, a drop cap, an underline, a date marker.
- **Motion.** Slow and courteous, 240–400ms: fades and line-by-line reveals of at most 8px. Nothing bounces.
- **Signature details.** Pull quotes, bylines with dates, numbered sections, asymmetric columns, captions in small mono.
- **Avoid.** Heavy UI chrome, chunky buttons, more than two type families, dense control clusters.

## Neo-brutalist

Raw, loud and confident. Structure is visible and proud of it.

- **Type pairing.** `--iu-font` at 700–800 for headings and buttons, uppercase labels, `font-mono` for metadata; big type set tight.
- **Radius.** `0` to `min(var(--iu-radius), 4px)`.
- **Borders and shadows.** 2px solid `--iu-foreground` outlines on every container and control. Hard offset shadows with no blur (`4px 4px 0 var(--iu-foreground)`); pressing an element moves it into its shadow.
- **Color.** Flat, high-contrast blocks. The accent is a solid fill on the primary element and at most one other block; no translucency.
- **Motion.** Snappy, 80–120ms, linear or stepped. Press: translate by the shadow offset and drop the shadow.
- **Signature details.** Thick outlines, offset shadows, sticker-like labels, oversized numerals, visible grid lines.
- **Avoid.** Soft shadows, subtle grays as structure, delicate type, pill shapes.

## Soft tactile

Calm, friendly and physical: everything looks pressable.

- **Type pairing.** `--iu-font` at 500–600 with generous size and leading; numerals set large in controls.
- **Radius.** Generous: `max(var(--iu-radius), 14px)` for cards and panels, full pills for buttons and toggles.
- **Borders and shadows.** Subtle 1px borders plus layered soft depth: a small ambient shadow, a larger diffuse one at low opacity, and an inner top highlight in light mode. Pressed states use an inset shadow.
- **Color.** Same-hue tints made with `color-mix` (accent at 6–12% over `--iu-surface`); accent fills for primary actions; never more than one hue.
- **Motion.** Springs (stiffness 300–400, damping 25–30), presses scale to 0.97–0.98, hover lifts of 1–2px. Interruptible.
- **Signature details.** Segmented controls with a sliding thumb, soft toggles, tactile sliders, pressable cards.
- **Avoid.** Hard edges, flat gray boxes, multiple tint hues, fully flat states with no depth change on press.

## Dark technical

The precise developer tool. Designed dark-first; light mode reads as a blueprint on paper.

- **Type pairing.** `--iu-font` for interface text and `font-mono` for labels, values, logs and code; uppercase mono micro-labels with `+0.08em` tracking.
- **Radius.** `min(var(--iu-radius), 8px)`.
- **Borders and shadows.** Hairline grids, dashed and dotted dividers, corner ticks. No soft shadows; depth comes from stepped surfaces.
- **Color.** Deep surfaces in dark mode. Status colors are semantic (healthy, warning, failing) and always paired with a text label or icon. The accent marks focus, selection and live state.
- **Motion.** 120–180ms and exact: stepped counters, streaming text with a cursor, progress that reflects real work. No bounce.
- **Signature details.** Terminal and log blocks, keyboard hints, status dots, metric readouts in mono, command bars.
- **Avoid.** Decorative effects, bubbly radii, ornament that a real tool would not ship.

## Playful

Joyful, bold and approachable, with personality kept on a leash.

- **Type pairing.** `--iu-font` at 700–800 for headings with tight tracking; big friendly numbers; the occasional label rotated a few degrees.
- **Radius.** `max(var(--iu-radius), 16px)` and full pills.
- **Borders and shadows.** 2px outlines, chunky offset shadows tinted from the accent (`color-mix` at about 30%) or from `--iu-foreground`; overlapping shapes.
- **Color.** The accent and its tints as cheerful blocks, illustrations drawn in SVG from simple geometric shapes. Accent, neutrals and one tint level, never more.
- **Motion.** Bouncy springs (stiffness 400, damping 15–20) on interaction only: a single wiggle on hover, count-ups, a checkmark that draws itself.
- **Signature details.** Sticker badges, big rounded buttons, illustrated empty states, celebratory success states drawn in SVG.
- **Avoid.** Emoji, loud multi-hue palettes, motion that plays without a reason.

## Luxury

Quiet confidence, space and restraint.

- **Type pairing.** `font-serif` display at light or regular weight and large sizes; `--iu-font` body at small sizes; labels uppercase with wide tracking (`+0.2em`); generous leading.
- **Radius.** `0` to `min(var(--iu-radius), 2px)` for surfaces, full pills for buttons as a deliberate contrast.
- **Borders and shadows.** Fine 1px rules, double rules, thin frames. No shadows.
- **Color.** Deep backgrounds or warm neutrals; the accent appears as a fine line or a small mark. Negative space does the work.
- **Motion.** Slow and graceful, 300–500ms: opacity and scale changes of 2% or less. No bounce.
- **Signature details.** Centered small labels, large serif numerals, thin dividers, product shown as the subject of the page.
- **Avoid.** Busy layouts, bold sans everywhere, heavy fills, crowded controls.

## Data-dense

Information-rich, scannable and efficient: interfaces people use all day.

- **Type pairing.** `--iu-font` at 12–14px with `font-mono` tabular figures; compact line height (1.3–1.4).
- **Radius.** `min(var(--iu-radius), 6px)`.
- **Borders and shadows.** Hairline table rules, zebra rows from a faint foreground tint, sticky headers; shadows only on floating layers.
- **Color.** Neutral base. Deltas are semantic and never color-only: an arrow, a sign and a color. The accent marks selection, focus and active filters.
- **Motion.** 100–150ms micro-interactions: row highlights, sparklines that draw once (skipped under reduced motion).
- **Signature details.** KPI tiles with SVG sparklines, compact tables with inline bars, filter chips, rows that respond to `--iu-density`.
- **Avoid.** Oversized padding, ornament, anything that pushes data below the fold.
