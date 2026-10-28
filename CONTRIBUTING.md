# Contributing to iloveui

iloveui is a catalog of hand-built UI designs in two formats (React + Tailwind v4, and plain HTML + Tailwind v4 with vanilla JS). Every design is free under the MIT License. Most contributions are new designs or fixes to existing ones; site and tooling fixes are welcome too.

[CLAUDE.md](CLAUDE.md) is the build specification and the source of truth. Sections 9 (catalog) and 16 (quality gates) matter most for contributors.

## Set up

You need Node 22.13 or newer and pnpm (the version pinned in `packageManager` in `package.json`; `corepack enable` picks it up).

```sh
pnpm install
pnpm setup   # creates .env.local, applies local D1 migrations, builds the registry, seeds a demo account
pnpm dev     # http://localhost:3000
```

No external accounts or keys are needed. Database and file storage run locally through Wrangler. The payments code (checkout, licenses, CLI tokens) stays in the repository as a reference architecture behind `MONETIZATION_ENABLED`, which defaults to `false`; you can leave it off.

To run the end-to-end suite or `pnpm design:check`, install Playwright's browser once: `pnpm exec playwright install --with-deps chromium`.

## Add a design

Each design lives in its own folder:

```
registry/designs/<category>/<slug>/
  meta.json        name, category, style family, description, tags, states, dependencies, version, createdAt
  component.tsx    the React + Tailwind v4 component (one file, typed props with defaults, named and default export)
  component.html   the same design in plain HTML + Tailwind v4 classes with vanilla JS
  preview.tsx      renders the component with demo data, with a state prop for every state declared in meta.json
  ai-prompt.md     sections: Component, Props, Tokens, Dependencies, Integration steps, Customization ideas
  notes.md         usage notes and the taste self-review
```

`<category>` is a slug from `registry/definitions.ts`; `<slug>` is kebab-case and unique across the catalog. Read [registry/README.md](registry/README.md), the authoring contract that turns section 9 into checkable rules, before you start, and read one existing design end to end.

Every design must:

- Meet its category brief (CLAUDE.md section 9.3) and follow one style family from [registry/style-families.md](registry/style-families.md).
- Theme only through the `--iu-*` CSS variables (`--iu-accent`, `--iu-background`, `--iu-foreground`, `--iu-radius`, `--iu-font` and the rest). No hard-coded brand colors.
- Design light and dark deliberately (not an inversion), and work at 375, 768 and 1440 px with no horizontal scrolling.
- Use semantic HTML, labelled controls, visible focus and full keyboard operation, with WCAG 2.2 AA contrast in both themes.
- Work with motion turned off (`prefers-reduced-motion`), and animate transform and opacity only.
- Use realistic, invented content: plausible brands, people, numbers and dates. No placeholder text or famous sample brands.
- Draw every visual in CSS or SVG (monogram avatars, code-drawn charts). No external images.
- Import only `react`, `motion/react` and `lucide-react` at runtime.
- Not repeat the layout or interaction of another design in its category.

Section 7.1 of CLAUDE.md lists visual patterns and words the project never uses; `pnpm lint` fails if any of them appear.

Check a single design while you work:

```sh
pnpm validate-registry --only <slug>   # meta.json schema, file rules, server-renders every declared state
pnpm design:check <slug>               # renders every state at 375/768/1440 in light and dark (React and HTML),
                                       # runs axe, checks overflow and console errors, writes screenshots
                                       # and contact sheets to test-results/design-check/<slug>/
pnpm exec prettier --write registry/designs/<category>/<slug>
```

`pnpm design:check <slug> --quick` renders 375 and 1440 only and skips the HTML version, for fast iteration. Look at both contact sheets before you open a pull request.

To add many designs at once with a coding agent, [BATCH.md](BATCH.md) is a self-contained procedure: it picks the categories furthest below their targets, balances style families and runs every gate.

## Pass the gates

| Command                  | What it checks                                                  |
| ------------------------ | --------------------------------------------------------------- |
| `pnpm typecheck`         | TypeScript in strict mode                                       |
| `pnpm lint`              | ESLint, Prettier and the forbidden words and patterns check     |
| `pnpm test`              | Vitest unit tests                                               |
| `pnpm validate-registry` | Every design folder against the catalog rules                   |
| `pnpm gates`             | All of the above plus the Playwright end-to-end suite, in order |

`pnpm gates` builds the production app, serves it in the local Workers runtime on port 3000, runs axe on every site route, renders every design preview at 375, 768 and 1440 in light and dark, asserts no horizontal overflow, and records each design's audit in `registry/audits.json`. It then runs the sign-in, checkout and refund flows against `pnpm dev` with `MONETIZATION_ENABLED=true`, which creates a temporary accountless Clerk app, so it needs internet access. Commit the updated `registry/audits.json` with your design.

CI runs the fast subset (`typecheck`, `lint`, `test`, `validate-registry`) on every pull request. Run `pnpm gates` locally before you open one that adds or changes a design.

## Pull requests

Keep each pull request to one design or one fix, describe what changed, and attach the default contact sheet for new designs. Do not commit `.env.local` or any other `.env` file.
