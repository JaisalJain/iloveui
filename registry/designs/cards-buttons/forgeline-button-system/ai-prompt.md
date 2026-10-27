# Forgeline button system

## Component

`ForgelineButtonSystem` is the button kit of an invented developer platform, shown in use and as a specimen sheet. The top half is a real deployment toolbar: a status line (Ready or Deploying, project, branch and commit), a segmented Logs/Metrics/Traces switch with a sliding thumb, three icon buttons with tooltips and shortcut hints, a secondary "Build log" and a split "Deploy" button whose chevron opens a menu of targets (production, preview, canary, roll back). The bottom half is the system itself: primary, secondary, ghost and danger buttons with their specs in mono, icon buttons at 24, 32 and 40px, and the keyboard map. The signature is Deploy: its label stays in the layout so the width never moves; while working it shows a spinner with real progress ("Building 42%", filled from the left) or, when no percentage is known, an honest elapsed timer, then "Live in 38s".

## Props

| Prop              | Type                                | Default        | Description                                                            |
| ----------------- | ----------------------------------- | -------------- | ---------------------------------------------------------------------- |
| `project`         | `string`                            | `"atlas-web"`  | Project name in the status line.                                       |
| `branch`          | `string`                            | `"main"`       | Branch.                                                                |
| `commit`          | `string`                            | `"7f3c2a1"`    | Short commit hash.                                                     |
| `url`             | `string`                            | Deployment URL | Shown on wide containers.                                              |
| `previousVersion` | `string`                            | `"v214"`       | Target of the roll back actions.                                       |
| `status`          | `"idle" \| "loading" \| "success"`  | uncontrolled   | Controls Deploy. Omit it to follow the promise returned by `onDeploy`. |
| `progress`        | `number` (0 to 1)                   | none           | Real progress; without it Deploy shows elapsed time.                   |
| `step`            | `string`                            | `"Building"`   | Word shown before the progress.                                        |
| `lastDuration`    | `number`                            | `38`           | Seconds shown on a controlled success.                                 |
| `disabled`        | `boolean`                           | `false`        | Disables every control (for example, no changes to deploy).            |
| `forceState`      | `"hover" \| "focus" \| "active"`    | none           | Renders an interaction state statically, for docs and previews.        |
| `defaultView`     | `"logs" \| "metrics" \| "traces"`   | `"logs"`       | Initial segment.                                                       |
| `onDeploy`        | `(target) => void \| Promise<void>` | none           | `target` is `"production"`, `"preview"` or `"canary"`.                 |
| `onRollback`      | `() => void`                        | none           | Menu and danger button.                                                |
| `onRedeploy`      | `() => void`                        | none           | Icon button, ghost button and the R key.                               |
| `onCopyUrl`       | `() => void`                        | none           | Icon buttons and the C key; write to the clipboard here.               |
| `onOpen`          | `() => void`                        | none           | Open deployment and Visit.                                             |
| `onViewChange`    | `(view) => void`                    | none           | Segmented switch and Build log.                                        |
| `className`       | `string`                            | `""`           | Extra classes for the `<section>`.                                     |

## Tokens

Reads `--iu-surface` and `--iu-background` (panel, segmented track, tooltips), `--iu-foreground` at 5 to 35% (hairlines, dashed dividers, the blueprint grid, secondary fills), `--iu-muted` (micro-labels and ghost text), `--iu-accent` with `--iu-accent-foreground` (primary and split buttons, corner ticks, focus rings), `--iu-radius` (capped at 8px), `--iu-font` and `--iu-density` (specimen padding). Status dots and the danger variant use emerald, amber and red, always with text.

## Dependencies

`react`, `motion` (segmented thumb, progress fill, menu) and `lucide-react` (icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/forgeline-button-system` (or copy `component.tsx` into `components/iloveui/`).
2. Add the `--iu-*` tokens with `npx shadcn@latest add @iloveui/tokens`.
3. Return your deploy request from `onDeploy`, or control `status` and `progress` from your build events for a real percentage.
4. Write to the clipboard in `onCopyUrl` (`navigator.clipboard.writeText(url)`), and wire `onRollback`, `onRedeploy` and `onOpen`.
5. The component listens for ⌘/Ctrl+Enter, Alt+Enter, C and R on the window while mounted (ignored inside inputs); remove that effect if your app owns those keys.
6. Delete the specimen section if you only need the toolbar; the button classes at the top of the file (`base`, `variants`) are the reusable system.

## Customization ideas

- Add a "Cancel" ghost button that appears beside Deploy while it runs.
- Drive `step` through Queued, Building, Uploading and Promoting from your pipeline's events.
- Add a size scale (`h-7`, `h-9`, `h-11`) to the specimen and the `base` class.
- Replace the segmented switch with environment tabs (Production, Preview, Development).
- Show a diff summary ("+412 −96 in 18 files") in the status line before deploying.
