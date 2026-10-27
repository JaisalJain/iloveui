# Saltmarsh residency form

## Usage notes

- Use it for applications, bookings and any long form where people benefit from seeing what they are sending: residencies, grants, fellowships, event submissions.
- Labels are always visible above underlined fields; every field has helper text that an error replaces (with an icon, `aria-invalid` and `aria-describedby`). Validation is late to punish and early to reward: text is checked on blur, empty fields wait for submit, and an error clears as soon as the value is fixed. Submit focuses the first invalid field and announces how many need attention.
- Discipline follows the WAI-ARIA select-only combobox: focus stays on the button and `aria-activedescendant` moves through the options. Arrows, Home, End, Enter, Space, Alt+Up, Escape, Tab and type-ahead (repeat a letter to cycle) work.
- Writing from is an editable combobox with list autocomplete: typing filters by city or country without accents getting in the way, the first match is highlighted, Enter or Tab picks it, Escape closes the list and a second Escape clears the text. A polite live region reports the number of matches, a no-match message suggests the nearest city, and free text that is not on the list is an error on blur.
- Season is a native radio group in a fieldset with a legend; arrow keys move the choice. The statement shows a live word count that turns red past the limit.
- The letter is ordinary text, so screen readers can read it as a summary; blanks are announced as "not filled in yet". Underlines follow focus and fade in 300ms; everything is instant under reduced motion.
- Every input state exists: default, hover, focus (an accent underline), filled, error, disabled (dashed underline, with the reason above the form), loading (fields locked, a spinner in a button that keeps its width) and success (Application received, a postmark on the letter).
- The sheet is a container-query context: two columns of fields from 576px, the letter beside the form from 896px (sticky while you scroll), stacked below. `--iu-density` scales the sheet padding.

## Taste self-review

- One clear focal point: Yes. The letter is the one object that changes as you work, and the accent underline inside it is the only moving color on a page of ink and paper.
- Spacing on the 4px scale: Yes. Fields sit 32px apart with 8px between label, field and helper, section rules have 12px under the numeral, the sheet pads 20px on phones and 48px wider, and columns are separated by 48px.
- Belongs in a Linear, Stripe or Vercel product: Yes. Under the editorial dress it is a rigorous form: exact keyboard patterns, honest error copy, a submit that keeps its width and reports progress, and a preview that removes the doubt about what will be sent.
- Meets its category brief: Yes. Labels always visible, helper and error text on every field, every input state, and an accessible custom select and combobox that follow the WAI-ARIA patterns.
- Distinct from every other design in its category: Yes. It is the catalog's editorial form and the only one that composes a live document from the answers; the soft tactile form lifts fields out of wells and morphs its submit button into a ring.
