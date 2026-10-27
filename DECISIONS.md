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

- **`@clerk/ui` is pinned and passed to `ClerkProvider`.** Clerk's documented way to keep styling that refers to its markup safe across UI releases; the UI then ships with the auth pages' bundle instead of loading from Clerk's CDN, and only those pages load it.
- **`@clerk/testing` is a dev dependency.** End-to-end tests must sign in to the Clerk development instance, and Clerk's official Playwright helpers supply the testing token that its bot protection requires; nothing in section 6 does that.

## Platform

- **Next.js 16.4 with `middleware.ts` on the Edge runtime.** Next 16 renames middleware to `proxy.ts`, but proxy always runs on Node.js and OpenNext marks Node middleware experimental with a large bundle cost, while `middleware.ts` remains supported (the build prints a deprecation notice).
- **Static-assets incremental cache with cache interception.** Every cacheable page is prerendered and never revalidated, so OpenNext serves the build output straight from Workers Static Assets; without a cache configured it would re-render static pages on every request.
- **Cache Components stays off.** OpenNext has open bugs with it, and turning it on removes the route segment options the static design pages rely on.
- **One minimal root layout, with the site stylesheet in `app/(site)/layout.tsx`.** Preview documents load only their own stylesheet. Unmatched URLs reach a catch-all page inside the site group that renders the site's 404, because Next preloads a root `not-found` boundary's stylesheet on every document (preview frames included), and the experimental `globalNotFound` flag would need a second root layout.
- **Typed routes are on.** A link to a route that does not exist fails the typecheck, which enforces the no-dead-links rule.
- **Every server code path reads configuration through `process.env`.** OpenNext exposes `.env.local` there locally and Worker secrets there in production, which keeps one code path for both.
- **Clerk keys come from an accountless Clerk development app that `pnpm setup` provisions when `.env.local` has none (docs override the spec).** `@clerk/nextjs` removed keyless mode in 7.8; an accountless app needs no account (only network access during setup), works in `next dev` and the local Workers preview, and can be claimed into a Clerk account later without changing its keys.
- **The middleware matches only `/account`, `/sign-in`, `/sign-up`, `/checkout` and `/api`.** Public pages never run Clerk, so they stay static and load no Clerk JavaScript, and `/r/` registry requests with iloveui tokens never reach Clerk's own token parsing.
- **A non-HttpOnly `iu_signed_in` cookie tells static pages that a visitor is probably signed in.** Design pages use it only to decide whether to ask the API for owner-only content; every API route still checks the Clerk session and the license itself.
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
- **The spring (stiffness 400, damping 30) is a CSS `linear()` easing sampled from the spring equation.** Hover lifts and layout changes on browse pages then follow the specified spring without shipping an animation library to the page with the tightest JavaScript budget.

## Site

- **One Theme Lab store and one preview bridge for the whole site.** `lib/client/theme-lab.ts` persists the theme and posts it to every `iframe[data-preview]`, and a bridge in the site shell forwards light/dark to frames that follow the site and answers each frame's ready message, so cards, the hero wall and the preview stage never need their own wiring.
- **The pricing page shipped in Phase 3, before checkout.** The locked Pro code panel needs a real destination for its unlock card; checkout buttons join the plans in Phase 4.
- **The pricing page renders per request.** Its currency comes from the `CF-IPCountry` header, so it cannot be one static file; every other page stays static.
- **The development region switcher sets a cookie the server reads only in development.** It tests both currencies locally without touching `.env.local`, and production ignores it.
- **The command palette loads `/catalog.json` the first time it opens.** Designs and categories become searchable without adding the catalog to every page's JavaScript.
- **The format filter on /designs chooses the first code tab instead of hiding designs.** Every design ships both formats (section 9.4), so filtering by format could only ever show everything; it records React or HTML under `iloveui.format`, which design pages open first, and says so next to the control.
- **Copy counts accept 60 requests per IP per minute.** "Most copied" needs an unauthenticated counter, and the D1 fixed window from `lib/rate-limit.ts` keeps one visitor from inflating it.
- **Theme Lab docks with `position: sticky` at the end of the /designs layout.** It stays on screen at the bottom of the viewport while browsing, like a fixed dock, but settles above the footer instead of covering it.
- **Card thumbnails are truly sandboxed (`allow-scripts` only); the preview stage frame is not sandboxed.** Thumbnails are static documents that only need their theme script, so they run in an opaque origin and talk to the page by window identity; the stage runs the Next.js preview app, which needs its own origin for its scripts and storage, and serves only our own code.
- **Client code imports catalog definitions from `registry/definitions.ts` and helpers from `lib/catalog-shared.ts`.** Neither pulls in zod or the generated catalog, which keeps the /designs JavaScript budget independent of catalog size.
- **Spec change (owner request, 2026-10-27): the /designs JavaScript target is under 200 kB gzipped through Phase 4, and Phase 5 tries for 150 kB as a best effort.** React and Next.js alone ship about 136 kB, which leaves too little room for the site's own code to make 150 kB a hard gate before Phase 5.
- **Measured on 2026-10-27, /designs loads 147.6 kB of JavaScript gzipped (231.1 kB before the loading pass).** The five largest contributors are react-dom (73.4 kB), the Next.js app router runtime (44.1 kB), the shared Next.js and React runtime chunk (8.2 kB), the site shell with Next's `Link` (8.0 kB) and the Turbopack runtime (4.4 kB); the home page loads 145.7 kB and a design page 216.7 kB.
- **Interactive parts load on intent, not at page load.** The command palette, shortcuts dialog, tooltips, Theme Lab's controls, the mobile filter sheet, the style family menu and the browse explorer's hydration wait for a shortcut key, pointerenter, focus or click (and Theme Lab renders as static markup until then), because anything loaded on a timer or when idle still counts against the first load.
- **Segmented controls on the load path are a small radiogroup (`components/ui/segments.tsx`) with Radix ToggleGroup's markup and keyboard model.** Radix ToggleGroup cost several kilobytes on every browse page; it remains in the parts that load on intent.
- **Clerk loads only on /sign-in, /sign-up, /account and checkout (owner rule, 2026-10-27).** Browse, design and other public pages never load Clerk's client; signed-in features there call our API, where the server-side auth checks decide.

## Accounts

- **Inside the Clerk route group, Clerk's client also keeps the `iu_signed_in` hint in sync.** Clerk finishes sign-in with a client-side navigation that the middleware never sees as a page load.
- **Signing out clears the hint before Clerk redirects.** A flag keeps Clerk's last signed-in render from writing it back, so the header shows "Sign in" on the next page.
- **Header sign-in and account links are plain `<a>` elements.** Public pages never prefetch Clerk routes, and following the link is a page load the middleware can refresh the session on.
- **A user deleted in Clerk keeps a users row with an empty email, stamped with the deletion time.** Their licenses stay for the payment records; their CLI token, bookmarks and held seats are removed in the same batch that records the webhook event.
- **/sign-in, /sign-up and /account are not indexed.** They are personal or transactional pages with nothing to find in search.
- **Clerk's warning colour maps to the site accent.** The site has one accent, and it also gives Clerk's development-mode badge enough contrast.
- **Account dates are formatted on the server in UTC.** The server render and the browser show the same text, with no hydration mismatch across time zones.
- **Rotating a token, refunding and removing a seat ask for confirmation; removing a bookmark does not.** The first three cannot be undone with one click, a bookmark can.
- **The `.env` line on /account keeps the `ilui_live_...` placeholder.** The real token appears only in its show-once block, so the snippets stay safe to copy into documentation or screenshots.

## Payments and access

- **`PaymentProvider` also has `getInvoice`.** Dodo Payments issues the invoices as Merchant of Record, so the account page's invoice link asks the provider instead of rendering our own.
- **The local test checkout and its webhook route exist only in development builds.** A compile-time `NODE_ENV` check around their dynamic imports removes them from production output, where those URLs return the site's 404 and `scripts/check-build.ts` confirms no LocalProvider code shipped.
- **LocalProvider's checkout link carries an HMAC-signed session that expires after 24 hours.** The local checkout page then needs no storage and no sign-in of its own, and a tampered link is rejected.
- **Webhooks are processed before they are acknowledged.** The event row, license and seats are written in one D1 batch and the route answers 200 only after it commits, so a failure is retried with the same webhook id and de-duplicated through `webhook_events`.
- **A refund revokes access when the provider confirms it.** Dodo's refund call returns a pending refund, so access ends on `refund.succeeded`; the local provider confirms at once.
- **A refund deletes CLI tokens only for people who lose Pro.** The owner and seat holders keep their token when another active license or seat still gives them access.
- **The checkout's cancel URL is /pricing.** Someone who backs out of payment lands where they chose the plan.
- **Any signed-in user can create a CLI token.** `/r/` checks Pro access on every request, so a token answers 403 until its owner has Pro and starts working the moment they buy it.
- **Tokens are stored as HMAC-SHA-256 keyed with `TOKEN_PEPPER`.** It is the standard construction for a peppered hash, and the 32 base62 characters come from rejection sampling, so every character is uniform.
- **`lastUsedAt` is written at most once a minute, and an install is counted once per user and design per five minutes.** The shadcn CLI requests an item several times during one `add`, which would otherwise multiply writes and counts.
- **The `/r/` rate limit is keyed by user, not by token.** One token per user means rotating the token cannot reset the limit.
- **The registry endpoint is `app/r/[name]/route.ts` and answers errors as JSON without redirects.** A `[name].json` segment resolves differently in next dev and on OpenNext, so the route takes the whole name and strips `.json` itself, and the shadcn CLI reads JSON error bodies.
- **Free registry items stay static in `public/r/`.** They are served before the Worker runs, so free installs are neither rate-limited nor counted.
- **Every download adds `theme.css` and writes the Theme Lab tokens into `component.html`.** The zip then matches what the design page copies, with the default tokens when no theme is given.
- **Bookmarks merge once, then the account wins.** The first signed-in visit merges a browser's local bookmarks into the account; after that the account's list is the source of truth and every toggle is mirrored to it.

## Catalog pipeline

- **Spec change (owner request, 2026-10-27): a nineteenth category, "Micro-interactions and motion components" (slug `micro-interactions`, 35 designs, 2 free).** Hero, bento, dashboards and AI chat drop to 25 and navigation, auth and pricing to 20, with hero and bento giving up one free design each, so the catalog stays at 365 designs and 24 free; Phase 6 now includes at least six micro-interactions, with slide to pay and the morphing submit button as the free pair.
- **Design tokens live in one global token set, and components read `--iu-*` directly.** It is the shadcn convention (one `@iloveui/tokens` registry theme item, a `theme.css` for copy and paste), and it lets a buyer re-theme every design at once; Theme Lab writes the same token block into copies and downloads.
- **Theme Lab defaults: vermilion accent, zinc neutrals, 10px radius, Inter Tight, comfortable density.** The accent foreground is computed per accent for 4.5:1 contrast, which makes it near-black on `#FF4D1F`.
- **Designs gate hover with `pointer-fine:hover:`.** Tailwind v4's `hover:` checks only `(hover: hover)`, and a site-level custom variant cannot travel with pasted code, so the portable form satisfies spec 7.3 wherever the design lands.
- **Interaction states are shown through a documented `forceState` prop.** CSS cannot force `:hover` or `:active` on demand, so designs that declare those states mirror them with a `data-force-state` attribute.
- **Tailwind CSS 4.1 is the floor for catalog code.** The `pointer-*` variants need 4.1, and newer utilities are written as arbitrary properties so the designs work in any Tailwind v4.1+ project.
- **The size receipt treats react, react-dom, motion and lucide-react as external.** The spec's own receipt example (2.4 kB with "motion, lucide-react") only works that way, and bundling motion (about 46 kB) would bury each design's own weight; dependencies are listed separately on the receipt.
- **Interactive previews are a statically generated `/preview/[slug]` route with its own stylesheet.** Each preview page loads only its own design's chunk through a generated loader map, and no site CSS, chrome or auth code.
- **Thumbnails are static, server-rendered HTML.** Cards and the hero wall show many designs at once, so they use script-free `public/thumbs/<slug>.html` (rendered output with an `inert` body, never source files) instead of hydrating a React app per iframe.
- **Pro payloads live in R2, free code in hashed static files.** `build-registry` uploads each design's registry item, highlighted code and AI prompt to `designs/<slug>.json` in the DOWNLOADS bucket (served only after an entitlement check), writes free designs' code to `public/code/<slug>.<hash>.json`, and keeps all of it out of the Worker bundle.
- **A Pro design's live preview runs its compiled, minified component in the browser.** Section 10 asks for the preview to be fully live, which needs that code on the client; the source files, registry item, AI prompt and zip stay in R2 behind the entitlement check, and `tests/unit/pro-source.test.ts` checks every public artifact for Pro source lines (ignoring lines that free designs share, such as the token block).
- **Code is highlighted at build time with shiki's JavaScript regex engine and role classes.** Highlighting never runs in the Worker, and five role classes colored by site tokens make the output a quarter of the size of inline styles.
- **Each design is a `registry:block` with one `registry:component` file targeted at `@components/iloveui/<slug>.tsx`.** It depends on the `@iloveui/tokens` theme item; items are validated against shadcn's own schema, which is why `shadcn` is a dev dependency (it is also used to test real CLI installs).
- **`component.html` loads Tailwind's browser build pinned to 4.3.3.** The file then works when opened on its own; the checks render it with compiled CSS instead, so nothing in the gates depends on a CDN.
- **`validate-registry` server-renders every declared state.** Each non-default state must render different markup from the default, and nothing may be server-rendered at opacity 0, which proves the states are real and the content is visible without JavaScript.
- **`pnpm design:check <slug>` renders one design without Next.js.** Design work runs in parallel without competing for the dev server, and the same axe, overflow and console checks as the gates run on every state, width and mode, plus the HTML version.
- **`registry/audits.json` is written by the end-to-end suite and committed.** The "axe: 0 violations" receipt is earned by the last audit of the exact design version (matched by content hash), never typed by hand.
- **Designs insert DOM nodes with `appendChild` and `insertBefore`.** `wrangler types` declares the Workers HTMLRewriter `Element` globally, which replaces the DOM's `append`, `prepend`, `before` and `after` in any project that runs it, including buyers deploying to Workers; the older methods type-check everywhere.

## Data

- **`users.updated_at` added to the section 12 model.** Clerk delivers webhooks at least once and out of order, so updates are applied only when newer than the stored row.
- **`webhook_events.provider` also accepts `clerk`.** Clerk webhook deliveries are de-duplicated through the same table as payment webhooks.
- **Foreign keys use NO ACTION, never CASCADE.** D1 always enforces foreign keys, and a cascade can silently delete child rows when a migration rebuilds a table.
- **The seed creates a Team license with one pending seat for `demo+clerk_test@iloveui.dev`.** Signing up locally with that Clerk test address (code 424242) activates the seat, which demonstrates Pro access and Team seats without a payment.

## Testing

- **End-to-end tests run against two targets, one after the other on port 3000.** Everything runs against `pnpm preview` (the production build in the local Workers runtime) except the local purchase journey in `*.dev.spec.ts`, which needs the development-only LocalProvider and therefore runs against `pnpm dev`.
- **Development-target specs run one at a time, after a warm-up.** They share the dev server's local D1 file (some specs also write to it through wrangler) and a rate-limited Clerk development instance, and purchases failed intermittently when they ran in parallel; the warm-up loads each page they drive first, because a click that lands before a cold page hydrates does nothing.
- **The build check looks for a code-only marker.** `scripts/check-build.ts` fails the preview or deploy if the string `iloveui-local-provider`, which exists only in LocalProvider code, appears anywhere in the production output.
- **The forbidden-words gate reads its lists from CLAUDE.md.** `scripts/check-forbidden.ts` (part of `pnpm lint`) derives the hype words, placeholder words and visual-pattern names from sections 7.1 and 16 at runtime, so no file outside CLAUDE.md has to spell them out.
- **Site accessibility checks add axe's best-practice rules to WCAG 2.2 AA.** They are closer to Lighthouse's accessibility audit; preview iframes are excluded there and audited on their own preview URLs.
