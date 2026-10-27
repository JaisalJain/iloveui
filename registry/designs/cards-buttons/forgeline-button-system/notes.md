# Forgeline button system

## Usage notes

- Use it as the action bar of a deployment, build or job page in a developer product, or as the reference for a product's button styles. `base` and `variants` at the top of the file are the system; the toolbar and specimen show them in use.
- Deploy is a split button: the main segment deploys to production (⌘/Ctrl+Enter); the chevron is a WAI-ARIA menu button (Enter, Space or ArrowDown open on the first item, ArrowUp on the last; arrows wrap, Home and End jump, Escape closes and returns focus, Tab closes, a click outside closes). While busy the main segment is `aria-disabled` and the chevron disabled.
- Loading keeps width: the idle label stays in the grid cell, invisible, while the busy label sits on top. With `progress` the button fills from the left and shows the percentage; without it an elapsed timer counts up, so the button never claims progress it does not know.
- The segmented switch is a radio group with roving tabindex (arrows, Home, End). Icon buttons have `aria-label`s and `aria-keyshortcuts`, and tooltips that follow the 400ms first-open and instant-reopen rule, shown on mouse hover and keyboard focus only.
- Shortcuts: ⌘↵ deploy, ⌥↵ deploy to preview, C copy URL, R redeploy; they are ignored while typing in a field and are listed in the specimen's keys row and in tooltips.
- Responsive: container queries; the toolbar wraps into two rows on phones, the specimen goes from one column to two to four. Every control reaches 40px on touch.
- States: `forceState` renders hover, focus and active on every button; `disabled` greys the primary, dashes the secondary and danger outlines; loading and success are the Deploy states with the status line switching to Deploying.
- Motion is exact and short (160ms): the segment thumb slides, the menu drops 4px, buttons press 1px. The spinner is the only loop and stops under reduced motion.

## Taste self-review

- One clear focal point: Yes. The accent Deploy split button at the end of the toolbar; everything else is neutral, and the specimen sheet sits below a dashed rule as reference.
- Spacing on the 4px scale: Yes. Buttons are 36px (40px on touch) with 14px padding, toolbar gaps of 8 and 12px, specimen padding 16 and 20px, a 16px blueprint grid.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like a deploy bar those teams ship: mono metadata, keyboard hints everywhere, a menu that follows the APG pattern, and a loading state that tells the truth.
- Meets its category brief: Yes. Hover, focus, active, disabled, loading and success all render on demand; the loading Deploy keeps its exact width; every icon button has an accessible name and a tooltip.
- Distinct from every other design in its category: Yes. Gumdrop buttons is playful and tactile, Verelle cards is a luxury card set; this is a dark-technical toolbar and specimen with a split button, segmented control and keyboard map.
