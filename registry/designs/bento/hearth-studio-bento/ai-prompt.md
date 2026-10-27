# Hearth studio bento

## Component

`HearthStudioBento` is a features section for a podcast and audio creator product, built from four soft, pressable cards. The tall card is the signature: a 48-bar waveform where speech is drawn in the accent and the room noise between phrases in grey; flipping the Studio sound switch springs the noise bars flat in a short ripple while the voice stays, the noise floor reading rolls from −38 dB to −71 dB and each noise source chip gains a check. The other cards hold a segmented control with a sliding thumb that reshapes an episode cover between 1:1, 16:9 and 9:16, a tactile slider that tightens the pauses in a speech timeline and counts the time saved, and chapter cards that work as a radio group.

## Props

| Prop                  | Type                                                  | Default                             | Description                                            |
| --------------------- | ----------------------------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| `kicker`              | `string`                                              | `"Hearth for podcasters"`           | Pill label above the heading.                          |
| `headline`            | `string`                                              | `"Sound like you booked a studio."` | Section heading.                                       |
| `subline`             | `string`                                              | Product summary sentence            | Paragraph under the heading.                           |
| `episodeTitle`        | `string`                                              | `"Ep. 41 · The slow kitchen"`       | Title on the cover preview and the chapters legend.    |
| `episodeSeconds`      | `number`                                              | `3134`                              | Episode length, used to show the trimmed running time. |
| `defaultStudioSound`  | `boolean`                                             | `false`                             | Initial state of the Studio sound switch.              |
| `defaultTarget`       | `"podcast" \| "video" \| "shorts"`                    | `"podcast"`                         | Initially selected export target.                      |
| `defaultThreshold`    | `number`                                              | `0.7`                               | Initial pause threshold in seconds (0.3 to 1.5).       |
| `chapters`            | `{ start: string; title: string; minutes: number }[]` | Four chapters                       | Chapter cards and the proportional chapter bar.        |
| `onStudioSoundChange` | `(enabled: boolean) => void`                          | none                                | Called when the switch flips.                          |
| `onTargetChange`      | `(target) => void`                                    | none                                | Called when the export target changes.                 |
| `onThresholdChange`   | `(seconds: number) => void`                           | none                                | Called while the slider moves.                         |
| `onChapterSelect`     | `(index: number) => void`                             | none                                | Called when a chapter is chosen.                       |
| `className`           | `string`                                              | `""`                                | Extra classes for the `<section>`.                     |

## Tokens

Reads `--iu-background` (section), `--iu-surface` (cards, switch knob, slider thumb), `--iu-foreground` (text, noise bars, card edges at 8 to 12 percent and the depth shadows mixed from it), `--iu-muted` (body copy and labels), `--iu-accent` (speech bars, switch track, slider fill, selected chapter, tints mixed at 6 to 14 percent; no text sits on accent fills, so `--iu-accent-foreground` is not needed), `--iu-radius` (floored at 20px for cards, 16px for inner panels), `--iu-font` and `--iu-density` (card padding).

## Dependencies

`react`, `motion` (springs, the sliding thumb, cross-fading readouts) and `lucide-react` (card icons and checks). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/hearth-studio-bento` (or copy `component.tsx` into `components/iloveui/hearth-studio-bento.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<HearthStudioBento />` below your hero and replace the copy and `chapters` with your product's.
4. Wire the `on*` callbacks to analytics if you want to see which feature visitors try first.
5. Keep the section on a plain `--iu-background`; the cards carry their own depth.

## Customization ideas

- Start with `defaultStudioSound` on and let visitors switch it off to hear the difference framed as before and after.
- Add a play button to the waveform card that sweeps a playhead across the bars.
- Replace the export targets with your own platforms and loudness specs.
- Show a transcript snippet in the chapter cards when one is selected.
- Raise `--iu-radius` in Theme Lab for an even softer, app-like feel; the cards keep a 20px floor.
