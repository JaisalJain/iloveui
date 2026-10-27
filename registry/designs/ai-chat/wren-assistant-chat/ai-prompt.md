# Wren assistant chat

## Component

`WrenAssistantChat` is a friendly assistant chat in the soft tactile style: a card with a header (assistant mark, context line and a monthly usage meter), a thread of user bubbles and assistant replies, and a pillowy composer. Assistant replies are built from parts: text, a tool call that unfolds into its arguments and result cards, and a day-by-day plan. When `status="streaming"`, the last reply streams character by character behind a soft caret, the tool call shows a spinner until its turn finishes, and Send presses into a Stop button whose ring fills with the reply's progress. When the reply lands, the usage meter ticks up by one.

## Props

| Prop             | Type                                             | Default                  | Description                                                                        |
| ---------------- | ------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------------- |
| `assistantName`  | `string`                                         | `"Wren"`                 | Name in the header, labels and placeholder.                                        |
| `context`        | `string`                                         | Trip context line        | Muted line under the name.                                                         |
| `greeting`       | `string`                                         | `"Where to next, Inés?"` | Headline of the empty state.                                                       |
| `messages`       | `WrenMessage[]`                                  | `WREN_DEMO_MESSAGES`     | The thread. An empty array shows the welcome state with suggestions.               |
| `status`         | `"idle" \| "streaming" \| "error"`               | `"idle"`                 | `streaming` plays the last assistant message; `error` cuts it off with Retry.      |
| `streamFrom`     | `number`                                         | `0`                      | Where streaming (or the failure) starts, from 0 to 1 of the reply.                 |
| `errorMessage`   | `string`                                         | Connection-lost copy     | Text of the error card.                                                            |
| `models`         | `WrenModel[]`                                    | `WREN_MODELS`            | Options of the model listbox.                                                      |
| `defaultModelId` | `string`                                         | `"wren-plus"`            | Initially selected model.                                                          |
| `attachments`    | `WrenAttachment[]`                               | `[]`                     | Chips already in the composer.                                                     |
| `defaultDraft`   | `string`                                         | `""`                     | Initial composer text.                                                             |
| `usage`          | `{ used: number; limit: number; label: string }` | `312 / 500 Replies`      | The header meter.                                                                  |
| `suggestions`    | `string[]`                                       | Three trip prompts       | Pressable cards in the empty state; choosing one fills the composer.               |
| `onSend`         | `(m: { text; attachments; modelId }) => void`    | none                     | Called on Enter or the send button.                                                |
| `onStop`         | `(messageId: string) => void`                    | none                     | Called from the Stop button or Escape; the reply freezes where it was.             |
| `onRetry`        | `(messageId: string) => void`                    | none                     | Called from Retry under a reply or in the error card.                              |
| `onCopy`         | `(messageId: string, text: string) => void`      | none                     | Called after a reply was copied as plain text.                                     |
| `onModelChange`  | `(modelId: string) => void`                      | none                     | Called when a model is chosen.                                                     |
| `onAttach`       | `(files: File[]) => void`                        | none                     | Called with the files picked through the paperclip.                                |
| `onStreamEnd`    | `(messageId: string) => void`                    | none                     | Called when the streamed reply is fully shown; set `status` back to `"idle"` here. |
| `className`      | `string`                                         | `""`                     | Extra classes for the root `<section>`.                                            |

`WrenMessage` is either `{ id, role: "user", time, text, attachments? }` or `{ id, role: "assistant", time, parts, tokens, model }`. `WrenPart` is `{ type: "text", text }`, `{ type: "tool", call }` or `{ type: "plan", items: { day, text }[] }`.

## Tokens

Reads `--iu-surface` (card, chips, result cards), `--iu-background` and `--iu-foreground` (mixed into the composer well and dark-mode steps), `--iu-border`, `--iu-muted`, `--iu-accent` (send button, Stop ring, best-fit border, caret, usage bar, user-bubble tint at 12%), `--iu-accent-foreground`, `--iu-radius` (floored at 14 to 24px for the soft family), `--iu-font` and `--iu-density` (paddings in the tool panel, plan rows and composer). Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (tool panel unfold, send/stop swap, usage tick) and `lucide-react` (icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/wren-assistant-chat`.
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Keep the thread in state. In `onSend`, append the user message and an empty-ish assistant message, then set `status="streaming"`.
4. Map your model's output to `parts`: text deltas into `text` parts, tool calls into `tool` parts with their arguments and results. For true token streaming, append to the last part and pass `streamFrom` near 1 so only new text animates.
5. Set `status` back to `"idle"` in `onStreamEnd` and `onStop`; abort your request in `onStop`.
6. On a failed request, set `status="error"` and pass an honest `errorMessage`; `onRetry` should resend the same prompt.

## Customization ideas

- Swap the stay results for product cards, calendar slots or flight options; the tool block takes any list.
- Replace the plan part with a checklist the user can tick off.
- Show the usage meter as tokens instead of replies by passing `{ used: 18420, limit: 50000, label: "Tokens" }`.
- Pin the composer by giving the root a fixed height and making the thread scroll.
- Add a third message action, such as Save to trip, next to Copy and Retry.
