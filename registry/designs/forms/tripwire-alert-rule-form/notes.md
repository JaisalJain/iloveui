# Tripwire alert rule form

## Usage notes

- Use it wherever people configure a rule against live data: alerting, autoscaling policies, fraud thresholds, budget alerts. The backtest answers the question every on-call engineer asks before saving: how noisy will this be?
- Rows pair a label and a short hint on the left with the control on the right from 672px; below that the hint is dropped and the label sits above the control. The backtest column moves under the form below 896px.
- Every control has a visible label, helper text that an error replaces (icon, `aria-invalid`, `aria-describedby`), and states for hover, focus, filled, error, disabled and read only. Errors appear on blur for filled fields and on save for everything, clear as soon as the value is fixed, and save focuses the first problem and announces the count.
- Metric is a WAI-ARIA select-only combobox (arrows, Home, End, Enter, Space, Escape, Tab); choosing a metric suggests a threshold at 75% of its 24-hour peak. Services is a multi-select combobox: type to filter, arrows to move, Enter toggles, Backspace in the empty input removes the last chip, every chip has a labelled remove button, and a polite live region reports additions and removals. Severity and channel are native radio groups, so arrow keys work.
- Conditional fields follow the channel: a Slack channel, a 32-character PagerDuty routing key, or a webhook endpoint with a signing option. The mute window reveals a native date range validated for order and a 14-day maximum, with the day count stated.
- The threshold line on the backtest is a pointer convenience with `touch-action: none`; the number field is the accessible control and moves the line too. The summary sentence is a polite live region, and the fired windows are a real table.
- The save bar is sticky at the bottom of the form, so the state is always visible: unsaved change count, errors, saving (spinner in a button that keeps its width), saved with time and version, or failed with a retry. Discard restores the saved rule.
- `--iu-density` scales row padding.

## Taste self-review

- One clear focal point: Yes. The backtest is the one picture on a page of compact rows, and its accent threshold line is the only accent shape that moves; everything you change on the left shows up there.
- Spacing on the 4px scale: Yes. Rows pad 12px top and bottom, controls are 32px (40px on touch), gaps inside rows are 4, 8 and 16px, and the panels pad 16px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like a monitoring product's rule editor: mono identifiers, exact numbers, a backtest grounded in real history, a plain-text rule definition, and a save bar that never hides what state the rule is in.
- Meets its category brief: Yes. Labels always visible, helper and error text throughout, every input state, accessible custom select and multi-select combobox, plus the slot's date range, conditional fields, validation and save states.
- Distinct from every other design in its category: Yes. It is the catalog's data-dense form and the only one with a live preview that evaluates the configuration against data; the other forms create a workspace with a morphing submit button and compose a letter from an application.
