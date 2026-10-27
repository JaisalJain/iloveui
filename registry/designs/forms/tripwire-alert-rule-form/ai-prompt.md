# Tripwire alert rule form

## Component

`TripwireAlertRuleForm` is a data-dense editor for a monitoring alert rule. Settings sit in label-and-control rows: rule name, a metric select (WAI-ARIA select-only combobox), a condition (comparison, threshold with unit, minimum duration), a services multi-select combobox with removable chips, severity and notification channel as segmented radio groups, channel-specific conditional fields (Slack channel, PagerDuty routing key, or webhook endpoint with an HMAC option) and an optional mute window date range. Beside the form a live backtest replays the last 24 hours of the metric: the threshold is a dashed accent line you can drag, every run past it is shaded, runs long enough to fire are tinted and listed with their window, length and peak, and a plain-text rule definition updates as you type. A sticky save bar counts unsaved changes and errors and shows saving, saved and failed states.

## Props

| Prop             | Type                                                | Default                | Description                                                             |
| ---------------- | --------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| `metrics`        | `TripwireMetric[]`                                  | Four metrics           | `{ id, label, unit, step, description }`; `step` rounds dragged values. |
| `services`       | `TripwireService[]`                                 | Eight services         | `{ id, team }` offered by the multi-select.                             |
| `existingNames`  | `string[]`                                          | Three rule names       | Names that fail the uniqueness check.                                   |
| `defaultValues`  | `Partial<TripwireValues>`                           | empty rule             | The saved rule; also the baseline for unsaved-change tracking.          |
| `errors`         | `TripwireErrors`                                    | none                   | Errors to show at once, for example from the server.                    |
| `status`         | `"idle" \| "saving" \| "saved" \| "failed"`         | internal               | Control the save state from outside.                                    |
| `savedAt`        | `string`                                            | `"14:32"`              | Time shown after a save.                                                |
| `version`        | `number`                                            | `4`                    | Rule version, increased on each save.                                   |
| `disabled`       | `boolean`                                           | `false`                | Read-only mode with `disabledReason`.                                   |
| `disabledReason` | `string`                                            | Viewer access sentence | Why the form is read only.                                              |
| `history`        | `Record<string, number[]>`                          | generated demo data    | 144 ten-minute samples per metric id, oldest first.                     |
| `now`            | `string`                                            | `"14:30"`              | Time of the last sample, for the axis and fire windows.                 |
| `onSave`         | `(values: TripwireValues) => Promise<void> \| void` | none                   | Called with valid values; throw to show the failed state.               |
| `onDiscard`      | `() => void`                                        | none                   | Called after changes are discarded.                                     |
| `className`      | `string`                                            | `""`                   | Extra classes on the section.                                           |

## Tokens

Reads `--iu-surface` and `--iu-background` (panels and the backtest column), `--iu-border` (row rules and frames), `--iu-foreground` (text, the metric line, control borders at 35%), `--iu-muted` (hints and labels), `--iu-accent` and `--iu-accent-foreground` (the threshold line and handle, selected severity and channel, checked boxes, focus rings, the Save button), `--iu-radius` (capped at 6px), `--iu-font` and `--iu-density` (row padding). Fired windows use a rose tint because they mean "would have alerted", always with the count in text. Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react`. Motion is CSS only: 100 to 150ms color changes and the threshold line easing to typed values (it follows the pointer exactly while dragged). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/tripwire-alert-rule-form` (or copy `component.tsx` into `components/iloveui/`).
2. Add the `--iu-*` tokens (`npx shadcn@latest add @iloveui/tokens`).
3. Pass the saved rule as `defaultValues` and your metrics and services lists; fetch the last 24 hours of each metric into `history` (144 points at 10-minute resolution).
4. Implement `onSave` to persist the rule; throw on failure. Map server-side validation into `errors`.
5. Pass `disabled` for viewers and `existingNames` from your rule list so names stay unique.

## Customization ideas

- Change the backtest window to 7 days with hourly samples by passing longer `history` arrays and adjusting `now`.
- Add an "Email" channel with a recipients multi-select reusing the services combobox.
- Show a second dashed line for a warning threshold below the critical one.
- Add a "Test notification" button next to the channel fields that posts a sample alert.
- Replace the rule definition with YAML or Terraform output for teams that keep alerts in code.
