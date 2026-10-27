# Hearth studio bento

## Usage notes

- Use it as the features section of a consumer or creator product where each feature can be tried in a few seconds. It is a full-width section.
- Reading order: heading, the tall Studio sound card, the export card, the pause trimmer, then the full-width chapters card.
- Controls are native or follow WAI-ARIA patterns: Studio sound is a `role="switch"` button labelled by its visible title; the export target is a radio group with roving tabindex (arrow keys, Home and End); the pause threshold is a native range input with a visible label and an `<output>`; chapters are native radio inputs inside cards, so arrow keys move between them. Noise chips announce "removed" or "present".
- The waveform, cover preview and pause timeline are decorative (`aria-hidden`); the readouts beside them (noise floor, shape, file, loudness, time saved) carry the information as text.
- Layout: one column at 375px, two at 768px with the waveform card spanning two rows, and a six-column grid from 1024px where the waveform card grows to fill its height.
- Motion: springs at stiffness 320 to 380 and damping 26 to 30, a 12ms stagger across the bars, a 0.98 press on chapter cards and a 2px lift on hover with a fine pointer. Reduced motion makes every change instant. Nothing loops.

## Taste self-review

- One clear focal point: Yes. The tall waveform card is the largest and most saturated surface, and its switch produces the one moment people remember: the hiss between words flattening while the voice stays.
- Spacing on the 4px scale: Yes. Card padding is 24px or 28px times density, grid gaps 16 and 20px, internal gaps 8, 12, 16, 20 and 24px.
- Belongs in a Linear, Stripe or Vercel product: Yes. Calm depth, one hue, precise monospaced readouts and controls that behave like native ones read like a well-made creator tool, not a toy.
- Meets its category brief: Yes. Four cells in three sizes (tall half, two half cells, full width) with a clear reading order, and every cell proves its feature with a working mini UI: noise removal, export reframing, pause trimming and chapter selection.
- Distinct from every other design in its category: Yes. It is the only soft tactile bento, built from floating cards rather than a ruled grid, and every cell is directly playable with different controls (switch, segmented control, slider, radio cards).
