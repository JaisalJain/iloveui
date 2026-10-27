# Wren assistant chat

## Usage notes

- Use it for a consumer or prosumer assistant that answers with real lookups: travel, shopping, scheduling. It expects a thread of user and assistant messages; assistant messages mix text, tool calls with arguments and results, and a short plan.
- The card grows with the thread. Drop it into a fixed-height layout and add `overflow-y-auto` to the thread if the composer must stay pinned.
- Keyboard: the tool call is a disclosure button (Enter or Space). The model picker is a select-only listbox (arrows, Home, End, Enter, Space, Tab chooses, Escape closes). Enter sends, Shift+Enter adds a line, Escape anywhere in the card stops a reply. Removing an attachment chip moves focus to the next chip or the message field.
- Screen readers: a polite live region announces replying, finished, stopped, copied, attached and removed. The streaming reply is `aria-busy`. The usage meter is a `role="meter"` with a value text such as "312 of 500 replies used". The caret, the Stop ring and the monogram tiles are hidden from assistive tech.
- Responsive: at 375px the assistant avatar drops, chips wrap and result cards truncate their detail line; from 448px the hint text and the full meter label appear.
- States: default is a finished thread with the stay search unfolded; loading streams the plan with Stop and its ring; error cuts the reply off with a Retry card; empty greets the user with three pressable suggestions.
- Motion: one interval drives the stream only while the card is on screen. Under reduced motion a demo frame stays still and a reply the user asked for lands at once.

## Taste self-review

- One clear focal point: Yes. The unfolded stay search is the visual anchor, with its single accent-bordered "Best fit" card; while streaming, the only moving accent is the ring around Stop.
- Spacing on the 4px scale: Yes. Gaps and paddings are 4px multiples (4, 8, 12, 16, 24, 28, 32px), card padding and plan rows scale with `--iu-density`, and radii step 12, 14, 18, 22 and 24px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is restrained and physical: one accent, layered soft shadows that turn into borders in dark mode, tabular prices and an honest usage meter.
- Meets its category brief: Yes. Streaming text with a caret; an expandable tool-call block with arguments and results; Copy and Retry under every reply; a composer with attachment chips and a model listbox; a usage meter in the header; a Stop state with a progress ring and Escape.
- Distinct from every other design in its category: Yes. Relay is a dark, log-like ops console with a timing gutter and result tables; Wren is a soft consumer chat with bubbles, pressable cards, a plan list and a progress ring on Stop.
