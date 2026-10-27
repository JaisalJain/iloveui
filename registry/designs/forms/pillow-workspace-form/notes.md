# Pillow workspace form

## Usage notes

- Use it as the first step of onboarding, or anywhere people create a new space in a team product. It expects a host for the URL preview, a role list and a time zone list; the defaults are realistic and can be replaced wholesale.
- The name drives two live previews: the monogram inside the field and the URL under it (`wrenhouse.app/fernway-studio`). Accents are folded and `&` becomes "and", so "Harbor & Pine Co" previews as `harbor-and-pine-co`, the slug `onSubmit` receives.
- Team size is a `fieldset` of native radios, so arrow keys, Tab and screen readers behave natively; the visible numerals are hidden from assistive tech in favour of a spoken label ("2 to 10 people").
- Role follows the WAI-ARIA select-only combobox: focus stays on the trigger and `aria-activedescendant` moves through the list. Arrows, Home, End, PageUp, PageDown, Enter, Space, Alt+Up, Escape, Tab and type-ahead (including repeated letters) work; the label focuses the trigger, and Escape stops there so a surrounding dialog stays open.
- Time zone is an editable combobox with list autocomplete: typing filters by city, country, IANA name, nearby cities or offset, the first match is highlighted, Enter or Tab picks it, Escape closes the list and a second Escape clears the text. A polite live region announces the number of matches, and text that matches nothing shows a no-match panel and, on blur, an error. Offsets are computed with `Intl` for today, so daylight saving is always right.
- Validation is late to punish and early to reward: errors appear on blur (for text that is there) or on submit, then clear as soon as the value is fixed. Errors replace the helper text, carry an icon, set `aria-invalid` and are referenced by `aria-describedby`; submit moves focus to the first invalid field and announces how many need attention.
- Submitting moves focus to the button, which keeps focus through its morph and is renamed "Creating workspace", then "Workspace created". The ring is the only loop in the design: it runs only while the request is pending, pauses when the form is offscreen and never runs under reduced motion, where every transition is instant and a still arc marks the wait.
- Popups open below their field over the following content; avoid `overflow: hidden` on ancestors, or render the form where it has room below.
- The root is a container-query context: below 384px of width the card padding, title and segment numerals step down, so it holds in a phone layout or a narrow column alike. `--iu-density` sets field height, padding and spacing.
- States: default (filled), focus (first field focused, empty form), error (inline errors), disabled (flattened with a reason), loading (pressed circle with the ring) and success (the check with the live URL).

## Taste self-review

- One clear focal point: Yes. The vermilion pill is the one large accent on a quiet card (the only other is the small switch track), and after you press it the same object becomes the ring and then the check, so attention never has to move.
- Spacing on the 4px scale: Yes. Fields sit 24px apart with 8px between label, field and helper; the card pads 20px on phones and 32px elsewhere; field and button heights are 48px; density scales the spacing from those values.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like the onboarding step those teams ship: one card, quiet type, precise states, real keyboard behaviour and a submit interaction that explains itself.
- Meets its category brief: Yes. Labels are always visible, every field has helper and error text, every input state exists (default, focus, error, disabled, loading, success), and the select and combobox follow the WAI-ARIA patterns with full keyboard support.
- Distinct from every other design in its category: Yes. It is the catalog's only form built on a soft tactile material, with fields that lift out of wells on focus and a submit button that collapses into its own progress ring and check while the freed space reports what is happening.
