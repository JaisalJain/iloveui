# Stepwise agent run

## Usage notes

- Use it as the run detail page of an agent platform, or as the side panel of an agent chat for power users. It expects a list of model and tool calls with start and end times in seconds, tokens, cost, input and output.
- From 896px of container width the conversation and composer sit in a 340px column beside the trace; narrower, they stack above it. The header's five totals fold into two columns, the timeline header shows only its range, and the Tokens and Cost columns appear from 672px.
- The trace is a real table with a caption and row headers. Each row header is a disclosure button (`aria-expanded`, `aria-controls`) whose name includes the step state, such as "Done: fx.rate". Rows are at least 32px tall and grow with `--iu-density` and to 40px on touch.
- The model selector is a select-only listbox (arrows, Home, End, Enter, Space, Tab chooses, Escape closes). Cmd/Ctrl+Enter runs, Escape stops a run.
- A polite live region announces the step that starts running, stops, failures, copies and attachments. The answer is `aria-busy` while it streams. The budget is a `role="meter"` with a value text like "$0.0586 of $0.2500 budget".
- States: default is a finished run with fx.rate expanded; loading plays from 10.6 s with draft_report running and the answer streaming; error fails slack.post with a 429 and offers Retry from slack.post.
- One interval drives playback only while the view is on screen. Under reduced motion a demo frame stays still and a new run lands finished.

## Taste self-review

- One clear focal point: Yes. The trace: during a run the only accent is the growing bar and its playhead; when finished, the selected row's accent marker leads to its input and output.
- Spacing on the 4px scale: Yes. Paddings are 4, 8, 12 and 16px with row and stat padding scaled by `--iu-density`; column widths are 4px multiples (60, 68, 72, 180, 340px).
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like an observability tool: mono figures, exact seconds and costs, hairline rules, zebra rows, one accent and honest semantic status.
- Meets its category brief: Yes. The answer streams with a caret; every tool call expands into its arguments and output; Copy and Retry run sit under the answer and Retry from the step sits on a failure; the composer has attachments and a model selector with prices; tokens and a cost budget meter sit in the header; Stop run cancels the remaining steps.
- Distinct from every other design in its category: Yes. Relay is a chat-shaped log with a timing gutter, Wren a soft consumer chat, Quire an editorial answer with citations; Stepwise is a trace-first run view with a timeline of parallel calls and running totals.
