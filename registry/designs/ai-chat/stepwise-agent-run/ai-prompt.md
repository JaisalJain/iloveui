# Stepwise agent run

## Component

`StepwiseAgentRun` is the detail view of one agent run, built for people who operate agents all day. A header carries the agent, run id, a status pill and five totals: elapsed time, steps, tokens in, tokens out and cost against a budget meter. Below, the task and the agent's answer sit beside a trace: one row per model or tool call with a timeline bar placed by its start and end, its duration, tokens and cost. Parallel calls overlap on the same seconds. Any row expands into its input (prompt or arguments) and its output or error. While the run plays, the running bar grows in the accent color, a playhead sweeps the timeline, the totals tick up and the answer streams as its drafting step runs. The composer has attachments, a model selector with prices, Run and Stop run.

## Props

| Prop                    | Type                                          | Default             | Description                                                                                         |
| ----------------------- | --------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `agent` / `runId`       | `string`                                      | Reconciler, run id  | Identity in the header.                                                                             |
| `task` / `requestedBy`  | `string`                                      | Payout task, a name | The task shown above the answer.                                                                    |
| `steps`                 | `StepwiseStep[]`                              | `STEPWISE_STEPS`    | Calls with `kind`, `name`, `start`/`end` seconds, tokens, cost, input, output and optional `error`. |
| `answer`                | `string`                                      | `STEPWISE_ANSWER`   | The final answer.                                                                                   |
| `answerStepId`          | `string`                                      | `"s8"`              | The step whose progress streams the answer.                                                         |
| `status`                | `"idle" \| "running" \| "error"`              | `"idle"`            | `running` plays the run from `runFrom`; `error` fails the step that has an `error`.                 |
| `runFrom`               | `number`                                      | `0`                 | Seconds into the run where playback starts or where it failed.                                      |
| `budgetUsd`             | `number`                                      | `0.25`              | Budget for the cost meter.                                                                          |
| `models`                | `StepwiseModel[]`                             | `STEPWISE_MODELS`   | Model options with their prices.                                                                    |
| `defaultModelId`        | `string`                                      | `"reason-2"`        | Initially selected model.                                                                           |
| `attachments`           | `StepwiseAttachment[]`                        | One checklist file  | Files in the composer.                                                                              |
| `defaultExpandedStepId` | `string \| null`                              | `"s7"`              | Row open on first render.                                                                           |
| `onSend`                | `(m: { text; attachments; modelId }) => void` | none                | Run a follow-up task (Run or Cmd/Ctrl+Enter).                                                       |
| `onStop`                | `(atSeconds: number) => void`                 | none                | Stop run (button or Escape); unfinished steps show as cancelled.                                    |
| `onRetry`               | `(stepId: string \| null) => void`            | none                | Retry the run, or from the failed step.                                                             |
| `onCopy`                | `(text: string) => void`                      | none                | Called after the answer was copied.                                                                 |
| `onModelChange`         | `(modelId: string) => void`                   | none                | Model chosen.                                                                                       |
| `onAttach`              | `(files: File[]) => void`                     | none                | Files picked through the paperclip.                                                                 |
| `onRunEnd`              | `() => void`                                  | none                | Playback reached the end; set `status` back to `"idle"`.                                            |
| `className`             | `string`                                      | `""`                | Extra classes for the root.                                                                         |

## Tokens

Reads `--iu-surface` (panels, sticky table header), `--iu-background` (composer well and expanded rows), `--iu-border` (hairline rules), `--iu-foreground` (text, bar fills at 70% for model calls and 30% for tool calls, zebra rows at 2.5%), `--iu-muted` (labels and secondary figures), `--iu-accent` (the running bar, playhead, caret, selected-row marker, budget bar, Run button and focus rings), `--iu-accent-foreground`, `--iu-radius` (capped at 6px), `--iu-font` and `--iu-density` (row and stat padding). Status hues are semantic: emerald for succeeded, red for failed, each with an icon and a label.

## Dependencies

`react`, `motion` (row fades and instant behaviour under reduced motion) and `lucide-react` (icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/stepwise-agent-run`.
2. Make sure the `--iu-*` tokens exist (`npx shadcn@latest add @iloveui/tokens`).
3. Map your tracing spans (OpenTelemetry, your agent framework's callbacks) to `steps`: seconds since the run started, token counts and cost per call, plus the input and output you want people to inspect.
4. For a live run, pass the steps known so far with `status="running"` and `runFrom` at the current time, and keep appending; for a past run, pass all steps with `status="idle"`.
5. When a step fails, put its message in `error` and pass `status="error"`; wire `onRetry(stepId)` to resume from it.
6. Abort the run in `onStop` and wire `onSend` to start a new run.

## Customization ideas

- Color bars by tool family (search, database, messaging) with one neutral step per family instead of the accent.
- Add a "Replay at 4x" control that drives `runFrom` from a timer for incident reviews.
- Show a per-step diff of the agent's memory in the expanded row.
- Group parallel calls under a collapsible "fan-out" parent row.
- Swap the budget meter for a latency SLO meter on latency-sensitive agents.
