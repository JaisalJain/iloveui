# Relay agent console

## Component

`RelayAgentConsole` is an agent console for an operations product, built in the dark-technical style. It has three parts:

- **Header:** thread title and a tool-health readout.
- **Thread:** laid out like a log. Role and time sit in a mono gutter, and each tool call shows its start offset beside it.
- **Composer:** removable attachment chips, a model listbox, a context meter, and a Send button that becomes Stop while the agent responds.

Agent turns are made of parts: text (with `**bold**` and `` `code` ``) and tool calls. Each call is a disclosure that shows its arguments as SQL or JSON and its result as a small table. A numeric column marked `bar` draws inline bars, with the peak in the accent color.

With `status="streaming"`, the last agent turn plays as a live run:

1. Text types out behind a steady block caret.
2. The running call ticks its elapsed milliseconds over skeleton rows, then resolves to Done as its rows land.
3. The context meter counts up.

The run pauses offscreen and is static under reduced motion. Copy, Retry (replays the run), Retry call (on a failed call) and Stop all work without a backend.

## Props

| Prop                 | Type                                       | Default                                                         | Description                                                                                                                                             |
| -------------------- | ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agentName`          | `string`                                   | `"Ops agent"`                                                   | Name in the header, the turn gutter and the composer label.                                                                                             |
| `title`              | `string`                                   | `"EU refund spike, Sat 24 Oct"`                                 | Thread title in the header.                                                                                                                             |
| `turns`              | `RelayTurn[]`                              | Demo thread (one question, one answer with two tool calls)      | The conversation. An empty array shows the new-thread state with suggested prompts.                                                                     |
| `status`             | `"idle" \| "streaming"`                    | `"idle"`                                                        | `"streaming"` plays the last agent turn as a live run and turns Send into Stop.                                                                         |
| `streamFrom`         | `{ part: number; progress: number }`       | `{ part: 0, progress: 0 }`                                      | Where the first streaming run starts: a part index and how far into that part, from 0 to 1.                                                             |
| `simulate`           | `boolean`                                  | `true`                                                          | Paces the last agent turn from complete data. Set `false` for real streams: parts render as given and the caret waits at the end of the last text part. |
| `tokensPerSecond`    | `number`                                   | `28`                                                            | Pace of the simulated stream (one token is a word).                                                                                                     |
| `tools`              | `RelayToolHealth[]`                        | warehouse, incident-log, deploys, all `"ready"`                 | Header readout. A `"degraded"` tool replaces "3 tools ready" with its name and an amber dot.                                                            |
| `models`             | `RelayModel[]`                             | `vesper-2` (200k), `vesper-2-mini` (128k), `vesper-2-long` (1M) | Options of the model listbox. `contextWindow` is the meter's limit.                                                                                     |
| `defaultModelId`     | `string`                                   | First model                                                     | Model selected on mount.                                                                                                                                |
| `attachments`        | `RelayAttachment[]`                        | Two files                                                       | Chips in the composer on mount.                                                                                                                         |
| `defaultDraft`       | `string`                                   | A follow-up prompt                                              | Composer text on mount.                                                                                                                                 |
| `contextUsed`        | `number`                                   | `30818`                                                         | Tokens in the context window, the last agent turn included. While a run plays, the meter counts up to this value.                                       |
| `suggestions`        | `RelaySuggestion[]`                        | Four prompts                                                    | Suggested prompts in the empty state. Picking one fills the composer and focuses it.                                                                    |
| `onSend`             | `(message: RelaySendPayload) => void`      | none                                                            | Called with `{ text, attachments, modelId }`. The message joins the thread at once; pass new `turns` to answer it.                                      |
| `onStop`             | `() => void`                               | none                                                            | Stop button, or Escape anywhere in the console, while streaming.                                                                                        |
| `onRetry`            | `(turnId: string) => void`                 | none                                                            | Retry under an agent turn. With `simulate`, the turn replays.                                                                                           |
| `onRetryTool`        | `(turnId: string, callId: string) => void` | none                                                            | Retry call on a failed tool call. With `simulate`, the run resumes from that call.                                                                      |
| `onCopy`             | `(turnId: string, text: string) => void`   | none                                                            | After the answer text was copied.                                                                                                                       |
| `onModelChange`      | `(modelId: string) => void`                | none                                                            | A model was picked in the listbox.                                                                                                                      |
| `onAttach`           | `(files: File[]) => void`                  | none                                                            | Files picked with the paperclip. Chips are added locally; upload the files here.                                                                        |
| `onRemoveAttachment` | `(attachmentId: string) => void`           | none                                                            | A chip was removed.                                                                                                                                     |
| `onStreamEnd`        | `(turnId: string) => void`                 | none                                                            | A simulated run reached its last part.                                                                                                                  |
| `className`          | `string`                                   | `""`                                                            | Extra classes for the root `<section>`, for example a height.                                                                                           |

Types, all exported:

- **`RelayTurn`** is one of two shapes:
  - `RelayUserTurn`: `{ id, role: "user", time, text, attachments? }`
  - `RelayAgentTurn`: `{ id, role: "agent", time, model, tokens, parts }`
- **`RelayPart`** is one of two shapes:
  - `{ type: "text"; text }`, where a blank line starts a paragraph.
  - `RelayToolCall`: `{ type: "tool", id, name, kind: "sql" | "api", summary, args, status: "done" | "error" | "running", durationMs, result?, error?: { code, message, afterMs }, open? }`
- **`RelayResult`** is `{ columns, rows, footnote? }`. Each column is `{ key, label, align?, decimals?, bar?, grow?, optional? }`.
- **`RELAY_DEMO_TURNS`** exports the demo thread, for stories and tests.

## Tokens

The console reads these tokens:

- `--iu-surface`: the console in light mode, plus tool blocks, chips and the composer.
- `--iu-background`: mixed into the deep dark panel and the recessed code areas.
- `--iu-border`: the console frame.
- `--iu-foreground`:
  - Answer text.
  - Hairlines, mixed at 11–13%.
  - Inline bars.
  - The Stop button.
- `--iu-muted`:
  - Narration, which is text that leads into a tool call.
  - Gutter labels.
  - Footnotes and figures.
- `--iu-accent` marks live state and the one thing that matters:
  - The streaming caret and running dots.
  - The peak bar of a result.
  - The Send button, the selected model and the mark.
  - Focus rings.
- `--iu-accent-foreground`: the Send label.
- `--iu-radius`:
  - Capped at 8px for the console and composer.
  - 6px for blocks and buttons.
  - 4px for code and keys.
- `--iu-font`: all UI text. Mono comes from `font-mono`.
- `--iu-density`: block, row and turn spacing.

Status colors are semantic and always come with an icon or a word: emerald for done and ready, amber for degraded and near limit, red for failed. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react` (icons). There is no animation library. Motion is CSS transitions plus the Web Animations API, driven by one `requestAnimationFrame` loop that runs only while a response streams on screen. Requires Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/relay-agent-console`, or copy `component.tsx` to `components/iloveui/relay-agent-console.tsx`.
2. Make sure the `--iu-*` tokens exist in your global CSS. `npx shadcn@latest add @iloveui/tokens` adds them.
3. Give the console a height for a full-screen agent, for example `<RelayAgentConsole className="h-dvh" />`. The thread then scrolls, follows new output unless the reader scrolled up, and keeps the composer pinned. Without a height, it grows with the thread.
4. Map your messages to `turns`:
   - User messages become `{ role: "user" }`.
   - Assistant messages become `{ role: "agent", parts }`.
   - Text becomes `{ type: "text" }` parts.
   - Tool invocations become `{ type: "tool" }` parts. Format `args` yourself (pretty JSON or SQL) and map the tool's output to `result.columns` and `result.rows`.
5. For a live backend, set `simulate={false}`:
   - Pass `status="streaming"` from the moment a message is sent until the stream ends.
   - Call your chat hook's send function from `onSend`, its stop function from `onStop`, and its regenerate function from `onRetry` and `onRetryTool`.
   - Keep updating the last turn's parts as tokens and tool results arrive. Set a running call's `durationMs` to its elapsed time.
6. Report the real context size in `contextUsed`, and list each model's context window in `models`. The meter turns amber with "Near limit" at 80%.
7. Keep `simulate` on for demos, empty-state onboarding and docs. Give a complete turn and `status="streaming"`, and the run plays itself, then calls `onStreamEnd`.

## Customization ideas

- Swap the warehouse and incident tools for your own. `kind: "sql"` highlights SQL keywords and strings, and `"api"` shows JSON with keys and values set apart.
- Chart a different metric inline by marking its column `bar: true`, for example p95 latency per region. The largest value takes the accent.
- Show tokens per part next to the start offsets in the gutter, to see where a long answer spent its budget.
- Replace `models` with your providers and their context windows. The meter re-scales when the model changes.
- Turn `suggestions` into saved investigations per team, each with the tool it will use.
