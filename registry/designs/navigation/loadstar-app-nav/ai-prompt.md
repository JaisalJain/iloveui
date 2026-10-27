# Loadstar app navigation

## Component

`LoadstarAppNav` is the full navigation shell of a dense operations product (freight, in the defaults): a 240px sidebar with the workspace, collapsible sections (Operations, Planning, Saved views) whose items carry live counts in tabular mono, and a 48px top bar with a sidebar toggle, a breadcrumb trail, a quick switcher, notifications and the signed-in user. Everything that navigates (a sidebar item, a breadcrumb sibling, a quick-switcher result or a shipment id in the table) moves one location, so the accent marker slides to the new item and the breadcrumb trail rebuilds segment by segment. The sidebar collapses to give the content the full width and peeks back as a floating layer when the pointer touches the left edge. The breadcrumb's page segment is a menu of its siblings with their counts. Below 1024px the sidebar becomes a modal drawer and the switcher folds into an icon that expands across the top bar.

The default content is a compact shipments table that follows the location; pass `children` to render your own page inside the shell.

## Props

| Prop                  | Type                                  | Default                     | Description                                                                 |
| --------------------- | ------------------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| `workspace`           | `string`                              | `"Loadstar · EU Freight"`   | Workspace name; the part after the last `·` starts the breadcrumb.          |
| `region`              | `string`                              | `"eu-west · 4 depots"`      | Mono line under the workspace.                                              |
| `sections`            | `LoadstarNavSection[]`                | `LOADSTAR_DEFAULT_SECTIONS` | Sidebar sections with items `{ id, label, count?, tone?, icon?, filter? }`. |
| `savedViews`          | `LoadstarNavItem[]`                   | Three views                 | The Saved views section; empty shows a "Save current filters" action.       |
| `shipments`           | `LoadstarShipment[]`                  | Eight shipments             | Rows for the default content and quick-switcher results.                    |
| `defaultLocation`     | `{ itemId: string; detail?: string }` | `{ itemId: "shipments" }`   | Where the shell starts; `detail` adds a fourth breadcrumb segment.          |
| `defaultCollapsed`    | `boolean`                             | `false`                     | Start with the sidebar collapsed.                                           |
| `status`              | `"idle" \| "loading"`                 | `"idle"`                    | `"loading"` swaps counts and rows for static skeletons.                     |
| `syncedLabel`         | `string`                              | `"Synced 12s ago"`          | Status line at the foot of the sidebar.                                     |
| `unreadNotifications` | `number`                              | `3`                         | Badge on the bell; 0 hides it.                                              |
| `userName`            | `string`                              | `"Rosa Lindqvist"`          | Shown as a monogram and read to screen readers.                             |
| `children`            | `ReactNode`                           | Shipments table             | Your page content inside the shell.                                         |
| `onNavigate`          | `(location) => void`                  | none                        | Called on every location change; route here.                                |
| `onSaveView`          | `() => void`                          | none                        | The empty Saved views action.                                               |
| `onClearFilters`      | `() => void`                          | none                        | The empty table action.                                                     |
| `onOpenNotifications` | `() => void`                          | none                        | The bell button.                                                            |
| `className`           | `string`                              | `""`                        | Extra classes for the root (it is `h-dvh` by default).                      |

## Tokens

Reads `--iu-background` (content and top bar), `--iu-surface` (sidebar, menus, drawer), `--iu-border` (hairlines), `--iu-foreground` (text, the selected-row tint, zebra rows at 2.5%), `--iu-muted` (labels, inactive items, separators), `--iu-accent` (the sidebar marker bar, the notification badge, focus rings), `--iu-accent-foreground` (badge text), `--iu-radius` (capped at 6px), `--iu-font` and `--iu-density` (every row height: sidebar, menus, switcher and table). Add them with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the sliding marker, the breadcrumb rebuild, the menu and drawer) and `lucide-react` (navigation and status icons). Tailwind CSS 4.1 or later; ids and counts use your `font-mono`.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/loadstar-app-nav` (or copy `component.tsx` to `components/iloveui/loadstar-app-nav.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Use it as the root layout of your app and render each route as `children`.
4. Build `sections` from your routes, with counts from your API; mark counts that need attention with `tone: "warning"`.
5. In `onNavigate`, push the route (`router.push`) for `itemId`, and for `detail` open the record. Derive `defaultLocation` from the URL and add a `key` when the route changes outside the shell.
6. Feed the quick switcher with your records through `shipments`, or adapt the result row to your own entity.

## Customization ideas

- Add a third quick-switcher group for carriers with their on-time rate.
- Show a 7-day sparkline next to each count on hover in the sidebar.
- Make the workspace block a switcher between regions using the same menu pattern as the breadcrumb.
- Persist `collapsed` in your user settings and pass it as `defaultCollapsed`.
- Set `--iu-density` to 0.8 for 24px rows on large monitors.
