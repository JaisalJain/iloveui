# Decisions

Choices the specification leaves open, places where current tool documentation or tool compatibility overrides a detail of the specification, and every dependency that is not named in the stack (section 6). One sentence of reasoning each.

## Toolchain

- **TypeScript 6.0 instead of 7.0.** typescript-eslint, which eslint-config-next depends on, supports TypeScript `>=4.8.4 <6.1.0`, and TypeScript 7.0 ships no compiler API, so 6.0.x is the newest release the required ESLint setup can parse.
- **ESLint 9.39 instead of 10.** The plugins bundled by eslint-config-next 16 (eslint-plugin-react, eslint-plugin-import, eslint-plugin-jsx-a11y) declare ESLint 9 as their newest supported major.
- **pnpm 12 with `allowBuilds` in `pnpm-workspace.yaml`.** pnpm 12 fails a fresh install on unreviewed build scripts, so the file approves the ones the stack needs (esbuild, workerd, unrs-resolver) and denies sharp, which nothing uses.
- **`pnpm setup` runs the package script.** On pnpm 12.15 a package.json script named `setup` (or `deploy`) takes precedence over pnpm's built-in command of the same name (verified), so the spec's `pnpm setup` works as written; `pnpm run setup` is the equivalent on older pnpm versions.
- **tsx runs the TypeScript scripts.** Node's built-in type stripping cannot resolve the `@/` path aliases or JSX that the scripts share with the app.
- **vite is a direct dev dependency.** Vitest 5 made it a peer dependency.
- **postcss and @tailwindcss/postcss.** They are Tailwind CSS v4's documented integration for Next.js and the same compiler the build scripts call for preview CSS.
- **eslint-config-prettier and prettier-plugin-tailwindcss.** The first stops ESLint and Prettier from disagreeing, the second keeps class order consistent across the site and the catalog.
- **@shikijs/langs is a direct dependency.** The highlighter imports individual grammars, and pnpm's strict layout only resolves packages that are declared.
- **@next/mdx, @mdx-js/loader, @mdx-js/react and @types/mdx.** They are Next.js's official MDX integration, required for the MDX docs and changelog.
- **server-only.** It turns an accidental client import of database, payment or token code into a build error.
- **drizzle-kit and wrangler.** drizzle-kit generates the committed SQL migrations and wrangler applies them and emulates D1 and R2 locally; both are implied by the stack.
- **Unit tests use wrangler's `getPlatformProxy` with an ephemeral D1.** It runs the same workerd D1 implementation as production (no interactive transactions, 100 bound parameters, enforced foreign keys) without adding a dependency.
- **`cloudflare-env.d.ts` is generated, not committed.** `pnpm setup`, `pnpm typecheck` and `pnpm build` run `wrangler types` first (about a second), which keeps 16,000 lines of vendor type definitions out of the codebase.
- **Fonts are self-hosted files loaded with `next/font/local`.** The same woff2 files serve the site through next/font and the sandboxed preview iframes through plain `@font-face`, so previews and the site never diverge and builds need no network access; the SIL Open Font License texts ship in `public/fonts/licenses/`.
- **OG images use TTF copies of the fonts in `assets/fonts/`, imported as bytes.** Satori reads TTF, OTF and WOFF but not WOFF2, and a Turbopack `bytes` rule embeds the files so the image routes never touch a filesystem.

## Platform

- **Next.js 16.4 with `middleware.ts` on the Edge runtime.** Next 16 renames middleware to `proxy.ts`, but proxy always runs on Node.js and OpenNext marks Node middleware experimental with a large bundle cost, while `middleware.ts` remains supported (the build prints a deprecation notice).
- **Static-assets incremental cache with cache interception.** Every cacheable page is prerendered and never revalidated, so OpenNext serves the build output straight from Workers Static Assets; without a cache configured it would re-render static pages on every request.
- **Cache Components stays off.** OpenNext has open bugs with it, and turning it on removes the route segment options the static design pages rely on.
- **One minimal root layout, with the site stylesheet in `app/(site)/layout.tsx`.** Preview documents load only their own stylesheet, and unmatched URLs still get the custom 404 through `app/not-found.tsx` without the experimental `globalNotFound` flag that two root layouts would need.
- **Typed routes are on.** A link to a route that does not exist fails the typecheck, which enforces the no-dead-links rule.
- **Every server code path reads configuration through `process.env`.** OpenNext exposes `.env.local` there locally and Worker secrets there in production, which keeps one code path for both.
- **`public/_headers` sets immutable caching for `/_next/static/*` and `/fonts/*`.** Workers Static Assets serves those files without running the Worker, so `next.config` headers do not apply to them.

## Design system

- **Accent shades that keep WCAG AA.** White on `#FF4D1F` measures 3.32:1 and `#FF4D1F` text on the light canvas 2.99:1, so primary buttons use the same hue at `#DA3805` (4.62:1 with white text), light-mode accent text, focus rings and selected states use `#C32F01` (at least 4.65:1 on every light surface), dark mode keeps `#FF4D1F` for accent text and indicators (at least 5.34:1), and the logo heart is always `#FF4D1F`.
- **A `control` border token for form fields.** Hairlines (8% alpha) are decoration only, so text fields use a border that keeps 3:1 against their surface (WCAG 1.4.11).
- **A `danger` text color (`#B42318` light, `#F97066` dark).** Error messages need a semantic color with 4.5:1 contrast; it is never used as an accent.
- **The heart is two rounded rectangles (1:1.48) rotated 45 degrees.** Lobes with square proportions read as a diamond at icon sizes, while this ratio reads as a heart down to 16px.
- **The wordmark is outlined from Inter Tight 600 with HarfBuzz kerning and committed as SVG paths.** A logo must render identically whether or not the web font has loaded, including in favicons and Open Graph images.
- **The favicon and app icons show the heart on a dark tile.** At 16px the full wordmark and even the dotted i are illegible, while the heart stays recognizable.
- **Loading skeletons are static.** The spec allows only one continuous motion (the hero wall), so skeletons communicate loading through layout and tone rather than a pulse.
- **The scrollbar gutter stays reserved and Radix's scroll-lock margin is switched off.** That combination keeps the page perfectly still when dialogs open, with classic and overlay scrollbars alike.
- **Dialogs focus their container when they open.** The title is announced and keyboard users tab into the controls, instead of a focus ring flashing on the first button.
- **Site light/dark preference is stored under `iloveui.mode`.** `iloveui.theme` belongs to Theme Lab's brand tokens, which are a separate concern.

## Data

- **`users.updated_at` added to the section 12 model.** Clerk delivers webhooks at least once and out of order, so updates are applied only when newer than the stored row.
- **`webhook_events.provider` also accepts `clerk`.** Clerk webhook deliveries are de-duplicated through the same table as payment webhooks.
- **Foreign keys use NO ACTION, never CASCADE.** D1 always enforces foreign keys, and a cascade can silently delete child rows when a migration rebuilds a table.
- **The seed creates a Team license with one pending seat for `demo+clerk_test@iloveui.dev`.** Signing up locally with that Clerk test address (code 424242) activates the seat, which demonstrates Pro access and Team seats without a payment.

## Testing

- **End-to-end tests run against two targets, one after the other on port 3000.** Everything runs against `pnpm preview` (the production build in the local Workers runtime) except the local purchase journey in `*.dev.spec.ts`, which needs the development-only LocalProvider and therefore runs against `pnpm dev`.
- **The build check looks for a code-only marker.** `scripts/check-build.ts` fails the preview or deploy if the string `iloveui-local-provider`, which exists only in LocalProvider code, appears anywhere in the production output.
- **The forbidden-words gate reads its lists from CLAUDE.md.** `scripts/check-forbidden.ts` (part of `pnpm lint`) derives the hype words, placeholder words and visual-pattern names from sections 7.1 and 16 at runtime, so no file outside CLAUDE.md has to spell them out.
- **Site accessibility checks add axe's best-practice rules to WCAG 2.2 AA.** They are closer to Lighthouse's accessibility audit; preview iframes are excluded there and audited on their own preview URLs.
