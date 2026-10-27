# Relay agent console

## Usage notes

### When to use it

Use it as the main screen of an agent that reads your data: operations, analytics, support. It expects a thread of user and agent turns. Agent turns mix text with tool calls that carry their arguments, duration and a result table or an error.

### Layout

The thread reads like a log.

- **Gutter.** From 672px wide, roles, times and each call's start offset (`+4.1 s`) sit in an 88px mono gutter. Narrower, they move above each turn.
- **Tool blocks.** Each block is its own container. The summary, the tool icon and columns marked `optional` drop when the block is narrow.
- **Narrow screens.** SQL and JSON keep their line structure at 375px, and inline bars shrink but stay.

### Height

- **No height set.** The console grows with the thread.
- **Height set** (`h-dvh`, or a flex child):
  - The thread scrolls.
  - The thread follows new output unless the reader scrolled up.
  - The composer stays pinned.

Thread and composer share one scroll container, so their columns stay aligned when a scrollbar appears.

### Hierarchy

Narration (text that leads into a tool call) is set in the muted color, so the final answer is the brightest text in the turn. The accent appears only on live state and on the peak of a result.

### Keyboard

- **Tool calls.** Each is a disclosure button: Enter or Space.
- **Model picker.** It follows the select-only combobox pattern:
  - Arrows, Home and End move.
  - Enter, Space and Alt+Up choose.
  - Tab chooses and moves on.
  - Escape closes without stopping a response.
- **Composer and run.**
  - Enter sends; Shift+Enter adds a line.
  - Escape anywhere in the console stops a response.
  - Removing a chip moves focus to the next chip, or to the message field.

### Screen readers

- **Run milestones** are announced in a polite live region: running a call, writing, complete, stopped, failed.
- **Actions** are announced in a second one: copied, attached, removed.
- **The streaming turn** is `aria-busy`.
- **Hidden visuals:** the caret, bars and skeletons are hidden from assistive tech.
- **Result tables** have captions.
- **The context meter** is a `role="meter"` with a full value text, such as "30,818 of 200,000 tokens, 15%".

### Motion

- **The run loop.** One `requestAnimationFrame` loop advances the run about 30 times a second, only while a response streams and the console is on screen. It stops offscreen.
- **The caret.** It stays steady while tokens arrive.
- **Tool results.** They fade their rows in and draw their bars once, with the Web Animations API.
- **Reduced motion.** Nothing animates. A streaming state is a still frame, and Retry lands the finished answer at once.

### States

- **Default:** a finished thread.
- **Loading:** `status="streaming"`, with a warehouse query running over skeleton rows and Stop in the composer.
- **Error:** a failed incident lookup with Retry call. The header names the degraded tool.
- **Empty:** `turns={[]}`, with suggested prompts and a line that explains why a new thread already uses 28,914 tokens.

## Taste self-review

- One clear focal point: Yes. The first tool result is a small bar chart, and its 14:00 bar is the only accent-colored data in the thread. The final answer is the brightest text, and during a run the only moving things are the caret and the running call's milliseconds.
- Spacing on the 4px scale: Yes. Paddings and gaps are 4px multiples (4, 8, 12, 16, 24, 32px), the gutter is 88px plus a 24px gap, block and row padding scale with `--iu-density`, and type sits at 11, 12, 13, 15, 28 and 34px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like an observability tool: real SQL with a scanned-bytes footnote, monospaced durations and offsets, a context meter with exact figures, keyboard hints and one restrained accent. Dark mode steps surfaces instead of using shadows; light mode reads as a blueprint on paper, with crisp hairlines and dashed section rules.
- Meets its category brief: Yes. The brief is met point by point:
  - Streaming text is simulated token by token with a caret, and can be paced against real data.
  - Tool-call blocks expand and collapse with `aria-expanded`.
  - Copy (with Copied feedback) and Retry sit under every answer, and Retry call sits on a failed call.
  - The composer has removable attachment chips and a paperclip that adds files.
  - The model selector is an accessible listbox.
  - The context meter shows used and limit tokens as a thin bar plus mono figures.
  - Send turns into Stop while streaming, with Escape as a shortcut.
- Distinct from every other design in its category: Yes. It is the catalog's only agent console laid out as a log with a timing gutter, whose tool results are live tables with inline bars, and whose run plays part by part from data rather than as a chat-bubble animation.
