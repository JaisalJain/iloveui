ILOVEUI SPECIFICATION

HOW TO USE THIS SPECIFICATION
This specification is the single source of truth for the iloveui project. Read it fully before writing any code. If a frontend-design skill is available to you, load it; where it conflicts with this specification, this specification wins. Execute PHASES 1 to 6 in order without stopping. At the end of each phase run every quality gate in section 16, fix every failure, then commit with the message "phase N: <summary>" and continue. Never leave TODO comments, placeholder text, lorem ipsum, unfinished functions, dead links, or commented-out code. If this specification is silent on a decision, choose the simplest, most accessible option that fits the design system and record it in DECISIONS.md with one sentence of reasoning. Before writing integration code for Next.js, @opennextjs/cloudflare, Cloudflare D1, Cloudflare R2, Wrangler, Clerk, Dodo Payments, the shadcn registry, or Tailwind CSS v4, read that tool's current official documentation with your web tools and follow it; where the docs and this specification disagree on an API detail, follow the docs and note it in DECISIONS.md.

OPEN-SOURCE STATUS (binding; overrides every other section where they differ)
• The project is open source under the MIT License (LICENSE). All designs are free: every meta.json has tier "free", and every design copies, installs and downloads anonymously.
• Monetization is off by default behind MONETIZATION_ENABLED (lib/monetization.ts). Off, /pricing, /sign-in, /sign-up, /account, /checkout, /dev/checkout and the account, checkout, token, code and webhook API routes answer 404, Clerk never runs, and the site shows no tier tags, tier filters, bookmarks, pricing teaser or sign-in link.
• The paid architecture (Clerk, licenses, Team seats, PaymentProvider with LocalProvider and DodoProvider, CLI tokens, entitlements, Pro-only registry items) stays in the code as a working reference. Sections 0, 8, 10, 11, 12 and 16 describe it; it applies only with MONETIZATION_ENABLED=true. MONETIZATION_PRO_SLUGS marks designs Pro for one build when the flag is on (the e2e dev run uses it).
• /terms, /refunds and /contact were removed and must not be rebuilt. /pricing, /sign-in, /sign-up and /account must not be linked or rebuilt as public pages unless the flag is on. Never add Pro designs or change a design's tier.

0. SCOPE OF THIS BUILD
• Everything runs on the owner's machine at http://localhost:3000. Do not deploy anything. Do not require any external account, API key, or paid service to run, test, or demo the full product.
• The architecture is production-ready for Cloudflare Workers, so going live later means adding secrets and running one deploy command, with no code changes.
• Local services:
  - Database: Cloudflare D1 emulated locally through Wrangler and the OpenNext Cloudflare dev bindings (no Cloudflare login needed).
  - File storage: Cloudflare R2 emulated locally the same way.
  - Authentication: Clerk running in keyless development mode when no Clerk keys are present; real keys are picked up automatically from .env.local when added.
  - Payments: the PaymentProvider interface with two implementations. DodoProvider is used whenever DODO_PAYMENTS_API_KEY is set. LocalProvider is used only when that key is absent AND NODE_ENV is development; it serves a local checkout page at /dev/checkout that looks like a real hosted checkout, shows a clear "Local test checkout" banner, offers Pay and Fail buttons, and on Pay sends a signed webhook to /api/webhooks/local, which runs the exact same fulfilment function as the Dodo webhook. LocalProvider and its routes return 404 in production builds and are excluded by a build-time check.
• A setup script (pnpm setup) creates .env.local from .env.example if missing, generates TOKEN_PEPPER and LOCAL_WEBHOOK_SECRET with crypto random bytes, applies D1 migrations locally, builds the registry, and seeds the local database with one demo account state for testing (no fake marketing data).

1. OWNER INPUTS (use these values everywhere; never invent others)
• Product name: iloveui (always lowercase).
• There is no production domain. Absolute URLs come from NEXT_PUBLIC_SITE_URL (http://localhost:3000 locally and by default); whoever deploys sets it to their own origin. Repository: https://github.com/JaisalJain/iloveui.
• License: the project is open source under the MIT License (see LICENSE) and has no seller, support email or refund policy.
• Prices: defined in section 11.

2. ROLE
You are a principal design engineer and staff full-stack architect with the craft of Rauno Freiberg, Emil Kowalski and Paco Coursey and the engineering rigor of the teams behind Linear, Vercel, Raycast and shadcn/ui. You build the product and the catalog yourself, end to end.

3. MISSION
iloveui is an open-source catalog of production-ready UI designs that developers paste into real apps. Target catalog: 365 designs, all free under the MIT License. (It launched as a marketplace with 24 free designs and one lifetime payment for the rest; that model now exists only behind MONETIZATION_ENABLED.) The site is the product's best showcase: if it looks generic, the product fails.

4. COMPETITIVE DESIGN BENCHMARK (what we learn from each, and how we beat it)
• Aceternity UI: famous for dramatic motion (beams, spotlights, 3D cards) on landing pages. Weakness: effects often overpower content, heavy dependencies, many designs share one look. We match its motion craft but use motion only to explain state and draw attention to one thing, and every design works with motion turned off.
• Magic UI: polished eye-candy primitives (marquees, number tickers, shimmer). Weakness: decorative pieces, not complete product screens. We ship complete, real-world sections and app screens, not toys.
• shadcnblocks: thousands of blocks. Weakness: volume creates sameness; it is hard to find the great ones. We win on curation, distinct style families, and fast filtering.
• Untitled UI: systematic, consistent, enterprise-grade. Weakness: safe and visually conservative. We match its consistency and state coverage with far more personality.
• Tailwind Plus: the quality bar for clean, canonical layouts and impeccable spacing. Weakness: plain, no live theming. We meet its spacing and typography discipline, then add live theming, receipts, and range.
The result must feel like this: Tailwind Plus discipline, Aceternity-level motion craft used with restraint, Untitled UI state coverage, and a gallery-grade browsing experience none of them have.

5. POSITIONING FEATURES (each must be visibly built)
• Theme Lab: live re-skinning of every preview to the buyer's brand; copied code carries their tokens.
• Two formats per design: React + Tailwind v4 TSX, and plain HTML + Tailwind v4 with vanilla JS.
• Real states: default, hover, focus, active, disabled, loading, empty, error and success where they apply; light and dark; 375px to 1440px.
• Receipts: gzipped size, runtime dependencies, accessibility audit result, reduced-motion support.
• Agent-native: shadcn CLI install under the @iloveui namespace, Copy AI Prompt button, llms.txt.
• Curation: 8 style families, filters that find the right design in seconds.

6. TECH STACK (exact; install the latest stable version of each at build time)
• Next.js App Router, using the newest major version that @opennextjs/cloudflare officially supports. React 19. TypeScript strict mode with noUncheckedIndexedAccess.
• Tailwind CSS v4 with CSS-first configuration (@theme) and OKLCH color tokens. clsx and tailwind-merge combined in a cn() helper.
• Site UI primitives: Radix UI (dialog, dropdown-menu, popover, tabs, tooltip, slider, toggle-group). Animation: motion (import from "motion/react"). Icons: lucide-react only.
• Code highlighting: shiki on the server, with one dark and one light theme derived from the site tokens.
• Runtime target: Cloudflare Workers through @opennextjs/cloudflare with wrangler.jsonc. Local dev uses the OpenNext dev bindings so D1 and R2 work inside next dev. No Vercel-specific APIs, no Node-only APIs in request paths.
• Database: D1 binding DB (database name iloveui-db) through Drizzle ORM, SQL migrations committed in drizzle/.
• Object storage: R2 binding DOWNLOADS (bucket name iloveui-downloads).
• Authentication: Clerk (@clerk/nextjs) with GitHub and Google enabled once real keys exist; keyless mode in development. Clerk owns identity only. D1 is the only source of truth for purchases and Pro access.
• Payments: PaymentProvider interface in lib/payments/provider.ts with createCheckout, verifyWebhook, getPayment, refund; implementations DodoProvider (official Dodo TypeScript SDK, one-time payments) and LocalProvider (section 0).
• Search: JSON index generated at build time, searched client-side with Fuse.js, opened with Cmd+K / Ctrl+K.
• Testing: Vitest, Playwright, @axe-core/playwright. Bundle measurement: esbuild in build scripts.
• Package manager: pnpm. ESLint with the Next.js config. Prettier.
• Any dependency not listed here requires a DECISIONS.md entry explaining why nothing listed would do.

7. DESIGN SYSTEM FOR THE MARKETPLACE SITE
7.1 Forbidden anywhere on the site:
• Purple, violet or blue gradients; gradient blobs; aurora or mesh backgrounds; glassmorphism; shimmer or glow badges; cursor spotlight effects; sparkles; emoji used as icons.
• The generic hero: centered headline, gradient text, two buttons, floating device mockup.
• Stock photos, AI-generated people, invented customer logos, invented testimonials, invented user counts or ratings.
• More than one accent color. Shadows stronger than the tokens below. Decorative animation that loops (the hero wall in 7.4 is the only continuous motion, and it pauses).
• Hype words: revolutionary, stunning, seamless, unleash, elevate, supercharge, game-changing, next-level.
7.2 Tokens (define in app/globals.css under @theme as OKLCH):
• Dark mode (default when the system prefers dark): canvas #0B0B0C, surface #121214, raised #18181B, text #EDEDED, muted text #A1A1A6, hairline rgba(255,255,255,0.08).
• Light mode: canvas #F5F3EF, surface #FFFFFF, raised #ECE9E3, text #111111, muted text #5C5C62, hairline rgba(0,0,0,0.08).
• Accent: #FF4D1F (signal vermilion) with #FFFFFF text. Used only for primary buttons, the logo heart, focus rings, selected states, and the Pro tag. Never as a large fill.
• Tags: Free is a neutral outline pill with muted text; Pro is an accent outline pill with accent text. No other tag styles.
• Typography, self-hosted with next/font: Inter Tight for UI and body; Instrument Serif italic for at most one emphasized phrase per headline; JetBrains Mono for code, CLI commands, receipts, counts and metadata labels. Scale in px: 12, 14, 16, 20, 28, 40, 64, 96. Headline letter-spacing -0.03em. Body line-height 1.55.
• Layout: 12-column grid, 1440px max content width, 24px gutters, spacing scale 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px. Left-aligned editorial composition, generous whitespace.
• Radius: 6px controls, 10px cards, 16px preview frames.
• Shadows: only 0 1px 2px rgba(0,0,0,0.06) and 0 8px 24px rgba(0,0,0,0.12).
• Motion: 160ms to 240ms, easing cubic-bezier(0.2, 0.8, 0.2, 1); springs at stiffness 400, damping 30 for hover lift and layout changes. Everything becomes instant under prefers-reduced-motion.
• Focus: 2px accent outline, 2px offset, on every interactive element.
• Logo: lowercase wordmark "iloveui" in Inter Tight weight 600; the dot of the first i is a small vermilion heart drawn in SVG from two rounded squares rotated 45 degrees. Deliver as an SVG component, favicon.ico, icon.svg, apple-icon.png at 180px, and a 1200x630 OG base.
• Voice: short, specific, confident, written for developers.
7.3 Design-engineering craft rules (apply to the site and every catalog design):
• Numbers use tabular-nums wherever they align or change. Headlines use text-wrap: balance; paragraphs use text-wrap: pretty.
• Interactive targets are at least 40x40px on touch and at least 24x24px everywhere.
• Hover effects apply only under @media (hover: hover) and (pointer: fine).
• Popovers, menus and tooltips animate from their trigger (transform-origin set from Radix CSS variables); tooltips have a 400ms delay on first open and none on subsequent opens within 500ms.
• Animations are interruptible; nothing blocks input while animating. No entrance animation on page navigation except the home hero.
• Icons align optically with text (lucide at 16px with 1.5 stroke in 14px and 16px text).
• Use scrollbar-gutter: stable on scroll containers; no layout shift when dialogs open.
• Every list and grid has designed loading skeletons that match final layout and designed empty states with one helpful action.
• Every destructive or important action gives clear feedback within 100ms (pressed state, then result).
• Keyboard shortcuts: Cmd/Ctrl+K search, / focuses search, T toggles theme, C copies the current code tab, shown in tooltips and in a ? shortcuts dialog.
7.4 Signature moments (build all four exactly):
• Home hero wall: four staggered columns of real designs rendered live in sandboxed iframes at 50 percent scale, scrolling vertically at different slow speeds, pausing on hover and offscreen, lazy-loaded, replaced by a static grid under prefers-reduced-motion. Left-aligned headline on a solid canvas-colored panel: "UI you'll actually ship." with "actually" in Instrument Serif italic. Subline: "Hand-built React and HTML designs. Re-theme them to your brand, then copy, install, or download." Buttons: "Browse designs" (accent) and "See pricing" (outline). Hovering a tile lifts it and shows name, category and Free or Pro tag; clicking opens the design.
• Theme Lab: dock fixed to the bottom of browse and design pages with accent picker (8 presets plus custom hex), neutral family (zinc, stone, slate), radius slider 0 to 24px, font (Inter Tight, Geist, IBM Plex Sans, system-ui), density (compact, comfortable), and reset. Values go to every preview iframe by postMessage as --iu-* CSS variables, persist in localStorage key iloveui.theme, and are written into code on copy and download.
• Preview stage: viewport presets 375, 768, 1440 and Full; drag handle for free resizing with live width in JetBrains Mono; light/dark toggle; state switcher from meta.json; Replay button that remounts the preview.
• Receipt bar in JetBrains Mono: gzipped size ("2.4 kB gzip"), runtime dependencies ("motion, lucide-react" or "0 deps"), "axe: 0 violations", "reduced motion: yes".

8. INFORMATION ARCHITECTURE (every route has a unique title, description and OG image)
• / : hero wall; value strip (Re-themeable, Two formats, Audited) with one sentence each; category index with live counts; picks row of 8; how it works (Pick, Theme, Ship); open-source section (pricing teaser only with MONETIZATION_ENABLED on); latest changelog entries; footer.
• /designs : sidebar with categories and counts, style family (plus a Free/Pro toggle only with monetization on), has-motion, and format filters; sort by newest or most copied; URL-synced filters; cards with live iframe thumbnail, name, category, tag and gzipped size; 24 per page with Load more and real paginated URLs.
• /designs/[category] : same view pre-filtered.
• /designs/[category]/[slug] : preview stage, title, description, tags, style family, receipt bar, React and HTML tabs with multi-file shiki viewer and copy, CLI install bar, Copy AI Prompt, Download zip, bookmark (monetization on only), 4 related designs (same category first, then same style family).
• /collections and /collections/[slug] : three curated sets: saas-landing, ai-app, dashboard.
• /pricing (MONETIZATION_ENABLED on only; 404 otherwise): Free, Pro, Team table; regional price note; FAQ (license, updates, team seats, CLI, formats, invoices, India pricing); checkout buttons.
• /sign-in, /sign-up (monetization on only): Clerk components styled to site tokens.
• /account (monetization on only): license status, plan, purchase date, invoice link, CLI token panel, components.json snippet, bookmarks, Team seat management for Team owners.
• /docs, /docs/installation, /docs/cli, /docs/theming, /docs/ai-prompts, /docs/license : MDX.
• /changelog : MDX entries from content/changelog/, newest first.
• /license (the MIT License text) and /privacy (a short statement that the site collects no personal data while MONETIZATION_ENABLED is false). There is no /terms, /refunds or /contact page; the footer links to the GitHub repository.
• Custom 404 and error pages. /sitemap.xml, /robots.txt, /llms.txt, /r/[name].json, /api/download/[slug]. With monetization on only: /api/checkout, /api/webhooks/dodo, /api/webhooks/local (development only), /api/webhooks/clerk, /api/token/rotate, /dev/checkout (development only).

9. CATALOG
9.1 Categories and target counts. Every design is free; the free counts in parentheses describe the original paid model and apply only if the owner turns monetization back on (total free = 24):
Hero sections 25 (2 free); Bento grids and feature showcases 25 (2); Navigation, mega menus and command palettes 20 (2); Pricing and checkout 20 (2); Testimonials and social proof 15 (1); Call to action and footers 20 (1); Auth and onboarding 20 (2); Dashboard shells and KPI cards 25 (2); Data tables and lists 15 (1); Forms and inputs 20 (2); Cards and buttons 20 (2); Modals, sheets and toasts 15 (1); AI chat and agent interfaces 25 (1); Text and background effects 20 (1); Micro-interactions and motion components 35 (2); Settings and account 10 (0); Empty, error and loading states 10 (0); E-commerce 15 (0); Full-page templates 10 (0).
9.2 Style families (every category uses at least four): Swiss minimal, Editorial, Neo-brutalist, Soft tactile, Dark technical, Playful, Luxury, Data-dense. Each family has a written definition in registry/style-families.md covering type pairing, radius range, border and shadow use, color behavior and motion personality; every design follows its family's definition.
9.3 Per-category craft briefs (every design in a category must meet its brief):
• Hero: one message in under 10 words, one primary action, a visual that shows the product rather than decorating it, readable at 375px without the visual.
• Bento and features: varied cell sizes with a clear reading order, each cell proving one feature with a mini UI, never icon-plus-paragraph cells only.
• Navigation and command palettes: full keyboard support, visible current location, mobile menu designed rather than collapsed, palette with groups, recent items and shortcuts.
• Pricing and checkout: one highlighted plan, comparable rows, monthly/yearly toggle where relevant with the saving stated, clear tax and refund line, error and success states for checkout.
• Testimonials and social proof: invented but plausible people with role and company, monogram avatars, no star-rating clichés.
• Call to action and footers: one action, footers with real link structure, newsletter field with validation states.
• Auth and onboarding: email and social sign-in, inline validation, password visibility toggle, loading and error states, progress indication for multi-step flows.
• Dashboard shells and KPI cards: collapsible sidebar, breadcrumb, realistic metrics with deltas and sparklines drawn in SVG, empty and loading states.
• Data tables and lists: sorting, selection with bulk actions, pagination, sticky header, responsive strategy for mobile, empty and loading states.
• Forms and inputs: labels always visible, helper and error text, every input state, accessible custom selects and comboboxes.
• Cards and buttons: all interaction states, loading buttons that keep their width, icon buttons with accessible names.
• Modals, sheets and toasts: focus trap, escape to close, return focus, stacked toasts with pause on hover, mobile bottom-sheet variants.
• AI chat and agent interfaces: streaming text simulation, tool-call blocks that expand, message actions (copy, retry), composer with attachments and model selector, token or usage meter, stop-generating state.
• Text and background effects: purposeful, performant (transform and opacity only, or canvas with requestAnimationFrame paused offscreen), full fallback under reduced motion; none of the forbidden patterns in 7.1.
• Micro-interactions and motion components: one self-contained interactive component whose motion communicates state, built with motion/react using transform and opacity only at 60fps. Each one must work with mouse, touch and keyboard, with an equivalent keyboard path for every gesture (for example, slide to pay also completes with Enter or Space, plus arrow keys to drag); use spring physics with velocity-aware release, snap back on an incomplete gesture, and be interruptible mid-animation; cover idle, active/dragging, loading, success, error and disabled states; announce state changes through an aria-live region; under prefers-reduced-motion, keep the function but swap motion for instant state changes or short fades; optionally call navigator.vibrate on success where supported, never required; expose callbacks (onComplete, onChange) and typed props for labels, thresholds and durations. Use these first, and do not duplicate interactions within the category: slide to pay, hold to confirm, swipe to delete row, drag to reorder list, pull to refresh, morphing submit button (idle → loading → success), copy button with icon morph, sliding segmented control, tabs with shared-layout indicator, expanding search field, island-style live notification, swipeable card stack, OTP input with auto-advance and paste, stepper/counter with rolling digits, animated toggle switch, magnifying dock, like button with restrained pop, progress ring with milestone checkpoints, accordion with height spring, toast stack with drag to dismiss. The forbidden list in 7.1 still applies: no sparkles, glows, cursor spotlights or decorative loops.
• Settings and account: grouped sections, save states, danger zone with confirmation.
• Empty, error and loading states: one clear next action, honest copy, illustrations drawn in SVG.
• E-commerce: product card, product page, cart drawer, checkout summary, with stock, variant and discount states.
• Full-page templates: complete pages assembled from catalog designs plus new connective sections, consistent in one style family.
9.4 Folder per design: registry/designs/[category]/[slug]/ with meta.json, component.tsx, component.html, preview.tsx, ai-prompt.md, notes.md.
9.5 meta.json (Zod-validated in registry/schema.ts): slug (kebab-case, unique), name, category, styleFamily, tier ("free" or "pro"; always "free" in this repository), description (max 160 characters), tags (3 to 8), states (subset of: default, hover, focus, active, disabled, loading, empty, error, success), hasMotion, dependencies (subset of: motion, lucide-react), registryDependencies, version (semver), createdAt (ISO date).
9.6 Rules for every design:
• Theming only through CSS variables: --iu-accent, --iu-accent-foreground, --iu-background, --iu-surface, --iu-border, --iu-foreground, --iu-muted, --iu-radius, --iu-font, --iu-density. No hard-coded brand colors.
• Light and dark both designed deliberately, never a simple inversion.
• Responsive at 375, 768 and 1440 with no horizontal scrolling.
• Semantic HTML, labelled controls, visible focus, full keyboard operation, ARIA only where native semantics fall short, WCAG 2.2 AA contrast in both themes.
• Realistic content: invented but plausible brands, people, numbers and dates. Never lorem ipsum, "Acme" or "John Doe".
• No external images or stock photos; visuals built with CSS, SVG, monogram avatars and code-drawn data.
• Runtime dependencies limited to react, motion and lucide-react.
• component.tsx: one file, typed props with defaults, named and default export, works pasted into any Next.js or Vite app with Tailwind v4.
• component.html: the same design in Tailwind v4 classes with vanilla JS, no framework.
• preview.tsx: renders the component with demo data and a state prop for each declared state.
• ai-prompt.md: sections Component, Props, Tokens, Dependencies, Integration steps, Customization ideas.
• notes.md: usage notes plus a taste self-review answering yes to: one clear focal point; spacing on the 4px scale; belongs in a Linear, Stripe or Vercel product; meets its category brief; distinct from every other design in its category. Any no means redesign before continuing.

10. REGISTRY, CLI AND ACCESS CONTROL (Pro items, tokens and entitlement checks apply only with MONETIZATION_ENABLED on; off, every item is a static free file)
• scripts/build-registry.ts validates every meta.json, bundles component.tsx with esbuild (react and react-dom external) to compute gzipped size with zlib.gzipSync, and emits the search index, receipt data, and registry item JSON matching https://ui.shadcn.com/schema/registry-item.json.
• Free registry items are static files. Pro items exist only in server-side code paths, never in public/, static JSON, or client bundles.
• /r/[name].json serves free items to everyone. Pro items require header Authorization: Bearer <token>; empty or missing token means anonymous; invalid token returns 401 JSON pointing to /account; valid token without an active license returns 403.
• Tokens: ilui_live_ plus 32 random base62 characters from crypto.getRandomValues, stored only as SHA-256 hash with TOKEN_PEPPER, shown once on creation or rotation, lastUsedAt tracked, one active token per user.
• /account shows this components.json addition, using NEXT_PUBLIC_SITE_URL as the base:
  "registries": { "@iloveui": { "url": "<SITE_URL>/r/{name}.json", "headers": { "Authorization": "Bearer ${ILOVEUI_TOKEN}" } } }
  and the .env line ILOVEUI_TOKEN=ilui_live_... ; every design page shows: npx shadcn@latest add @iloveui/<slug>
• Pro code for non-owners: preview fully live; code tabs show a server-rendered locked panel with file names, line counts and an unlock card. Never send any real Pro source line to a non-owner. Copy AI Prompt and Download are locked the same way.
• Downloads: per-design zips (component.tsx, component.html, ai-prompt.md, LICENSE.txt) built into R2 by scripts/build-zips.ts; /api/download/[slug] checks entitlement and streams from R2; 60 downloads per user per hour.
• Rate limits via a D1 fixed-window counter: /r/ 120 requests per token per minute; checkout 10 per user per hour.

11. PRICING, CHECKOUT AND LICENSE (reference architecture; active only with MONETIZATION_ENABLED on)
• config/pricing.ts: Free (24 designs, commercial use); Pro lifetime launch USD 99, regular USD 149, single user, all current and future designs; Team lifetime USD 299, up to 10 seats; India pricing INR 4,999 Pro and INR 14,999 Team. Each plan maps to a Dodo product id from env vars; LocalProvider uses the same plan definitions.
• Region: read the CF-IPCountry header; IN gets INR, others USD. When the header is absent (local development), use DEV_REGION from .env.local (default IN). A small region switcher appears in the footer only in development for testing both.
• /api/checkout requires sign-in, creates a one-time checkout with the Clerk user id and email in metadata, returns the checkout URL; return URL is <SITE_URL>/account?checkout=success.
• Fulfilment lives in one function, lib/payments/fulfil.ts, called by both webhook routes: verify signature, store event id in webhook_events and ignore duplicates, on success create the license (Pro or Team) and seats, on refund mark it refunded and revoke tokens. Never grant access from the return URL alone.
• /api/webhooks/clerk verifies the signature and upserts or deletes users; in keyless mode, users are upserted on first authenticated request.
• Team: owner invites up to 9 more emails from /account; an invite becomes an active seat when that email signs in.
• License (in LICENSE, /license and each zip's LICENSE.txt): the MIT License, Copyright (c) 2026 Jaisal K Jain.

12. DATA MODEL (Drizzle on D1)
users (id = Clerk user id, email, createdAt); licenses (id, ownerUserId, plan: pro or team, currency, amountMinor, providerPaymentId unique, provider: dodo or local, status: active or refunded, createdAt); seats (id, licenseId, email, userId nullable, status: invited, active or removed, createdAt); api_tokens (id, userId unique, tokenHash, lastUsedAt, createdAt); bookmarks (userId, slug, createdAt, primary key userId+slug); design_metrics (slug primary key, copies, installs, downloads); webhook_events (id, provider, eventId unique, receivedAt); rate_limits (key, windowStart, count, primary key key+windowStart).
Pro access = owning an active license or holding an active seat on one. Implement once in lib/entitlements.ts and use it everywhere.

13. PERFORMANCE, SEO AND ACCESSIBILITY TARGETS (measured on the production build served locally)
• Lighthouse mobile on /, /designs and one design page: Performance 95+, Accessibility 100, Best Practices 100, SEO 100.
• LCP under 2.0s, CLS under 0.05, INP under 200ms; /designs JavaScript under 200 kB gzipped for Phases 1 to 4 (Phase 5 tries to reach 150 kB, as a best effort only); iframes lazy-load and pause offscreen.
• Design pages statically generated; per-design OG images at build; JSON-LD Product on /pricing and SoftwareSourceCode on design pages; llms.txt lists catalog, install commands and docs.

14. ENVIRONMENT VARIABLES (.env.example with one-line comments; only TOKEN_PEPPER and LOCAL_WEBHOOK_SECRET are required locally, and pnpm setup generates them)
NEXT_PUBLIC_SITE_URL (http://localhost:3000 locally), DEV_REGION, TOKEN_PEPPER, LOCAL_WEBHOOK_SECRET, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, CLERK_WEBHOOK_SIGNING_SECRET, DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_WEBHOOK_KEY, DODO_PAYMENTS_ENVIRONMENT (test_mode), DODO_PRODUCT_PRO_USD, DODO_PRODUCT_PRO_INR, DODO_PRODUCT_TEAM_USD, DODO_PRODUCT_TEAM_INR, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN. Bindings in wrangler.jsonc: DB (iloveui-db), DOWNLOADS (iloveui-downloads). .env.local is listed in .gitignore.

15. REPOSITORY LAYOUT
CLAUDE.md; app/; components/site/; components/theme-lab/; components/preview/; registry/designs/; registry/schema.ts; registry/style-families.md; lib/ (auth.ts, db/, entitlements.ts, payments/ with provider.ts, dodo.ts, local.ts, fulfil.ts; tokens.ts; rate-limit.ts; search.ts); content/docs/; content/changelog/; scripts/ (setup.ts, build-registry.ts, build-zips.ts, validate-registry.ts); tests/unit/; tests/e2e/; drizzle/; public/; config/pricing.ts; wrangler.jsonc; DECISIONS.md; README.md; .env.example.
Scripts in package.json: setup, dev, build, preview (OpenNext Workers runtime locally), typecheck, lint, test, test:e2e, validate-registry, build-registry, build-zips.

16. QUALITY GATES (end of every phase; a phase is not done until all pass)
• pnpm typecheck, pnpm lint and pnpm test pass with zero errors and zero warnings.
• pnpm validate-registry passes for every design.
• pnpm preview starts the app in the local Workers runtime and the e2e suite passes against it.
• Playwright renders every design preview at 375, 768 and 1440 in light and dark, saves snapshots, and asserts no horizontal overflow.
• axe-core reports zero violations on every site route and every design snapshot.
• A search of the codebase for the forbidden words and patterns in 7.1, plus "TODO", "lorem", "Acme" and "John Doe", finds nothing outside CLAUDE.md.
• Tests prove that, with MONETIZATION_ENABLED on, signed-out and signed-in non-owner requests to a Pro registry item, download, and code panel receive zero lines of Pro source; and that with it off every design is served anonymously and every account, payment and Pro route is a 404.
• A test proves LocalProvider routes return 404 in a production build.

17. PHASES
Phase 1. Scaffold the stack, OpenNext Cloudflare config with local D1 and R2 bindings, Drizzle schema and migrations, pnpm setup, tokens, fonts, logo, root layout, header with Cmd+K palette, footer, theme toggle, keyboard shortcuts dialog.
Phase 2. Registry schema, style-families.md, build-registry, validate-registry, build-zips, the quality-gate pipeline, and the first 8 designs (one per style family, different categories) to prove the pipeline.
Phase 3. /designs, category pages, design page with preview stage, Theme Lab, receipt bar, shiki viewer, CLI install bar, Copy AI Prompt, bookmarks, related designs, search index and palette.
Phase 4. Clerk (keyless locally), users sync, entitlements, PaymentProvider with LocalProvider and DodoProvider, fulfilment, licenses, Team seats, tokens and rotation, /r/ endpoint, downloads, rate limits, /account. End-to-end test: sign in, buy Pro through the local checkout, see code unlock, install via the registry endpoint with the token, download a zip, then refund and confirm access is revoked.
Phase 5. Home page with hero wall, pricing, collections, docs, changelog, legal pages, contact, 404 and error pages, sitemap, robots, llms.txt, OG images, JSON-LD. Hit every target in section 13.
Phase 6. Catalog batch one: bring the catalog to 60 designs, exactly the 24 free designs in 9.1 plus 36 Pro designs across all 19 categories and all 8 style families, including at least 6 micro-interaction designs among them both free ones (slide to pay and the morphing submit button), every one passing every gate. Then write README.md and BATCH.md.

18. README.md CONTENT
Local setup on Windows with WSL2 (Ubuntu): Node 22 LTS, pnpm, pnpm install, pnpm setup, pnpm dev, open http://localhost:3000. How to test a purchase locally. How to add real Clerk keys and real Dodo test keys to .env.local (and that LocalProvider switches off automatically). A separate "Going live" section listing, without executing: creating D1 and R2 in Cloudflare, applying migrations remotely, setting secrets with wrangler, configuring Clerk and Dodo webhooks to the production domain, switching DODO_PAYMENTS_ENVIRONMENT to live_mode, and deploying.

19. BATCH.md CONTENT (write in Phase 6)
A self-contained instruction that, when run with "Execute BATCH.md", adds the next 30 designs (tier free, like every design): re-read CLAUDE.md first, pick categories furthest below their targets in 9.1 (micro-interactions follow the same rule as every other category), keep style families balanced, never duplicate the layout or interaction of an existing design, follow every rule in section 9 including the category brief, run every gate in section 16, add a changelog entry listing the new designs, and commit as "catalog: batch N" with N incrementing.

make ui designs that will give a "wow" factor when people see it
(do not commit with claude as coauthor)

20. DEFINITION OF DONE
/goal all six phases committed; every gate passes; 60 designs live at http://localhost:3000, all free under the MIT License; pnpm setup then pnpm dev works on a fresh clone with no accounts; with MONETIZATION_ENABLED on, a local test purchase unlocks Pro and a refund revokes it, and adding real Clerk and Dodo keys switches providers with no code changes; no Pro source reaches any non-entitled request; nothing from the forbidden list appears anywhere.
