# iloveui

A marketplace of hand-built UI designs that developers paste into real apps. Every design ships as a React + Tailwind CSS v4 component and as plain HTML with vanilla JavaScript, re-themes live to your brand with Theme Lab, and installs with the shadcn CLI. 24 designs are free; the rest unlock with one lifetime payment.

Everything runs on your machine at http://localhost:3000 with no accounts and no paid services: Cloudflare D1 and R2 are emulated locally, Clerk runs on a temporary development app, and purchases go through a local test checkout. The same code deploys to Cloudflare Workers when you add real keys.

The full specification is [CLAUDE.md](CLAUDE.md); every choice it leaves open is recorded in [DECISIONS.md](DECISIONS.md).

## Local setup on Windows (WSL2, Ubuntu)

1. Install WSL2 with Ubuntu from an administrator PowerShell, then open the Ubuntu terminal for every step that follows:

   ```powershell
   wsl --install -d Ubuntu
   ```

2. Install Node.js 22 LTS inside Ubuntu, for example with [nvm](https://github.com/nvm-sh/nvm):

   ```bash
   nvm install 22
   nvm use 22
   ```

3. Enable pnpm. The repository pins its version in `package.json`, and Corepack installs it:

   ```bash
   corepack enable
   corepack prepare pnpm@12.15.0 --activate
   ```

4. Clone the repository into the Linux file system (for example `~/code/iloveui`, not `/mnt/c/...`, which is much slower), then install, set up and start:

   ```bash
   pnpm install
   pnpm setup
   pnpm dev
   ```

5. Open http://localhost:3000 in your Windows browser (WSL forwards localhost).

`pnpm setup` is safe to run again. It:

- creates `.env.local` from `.env.example` and generates `TOKEN_PEPPER` and `LOCAL_WEBHOOK_SECRET`;
- creates a temporary accountless Clerk development app and writes its keys to `.env.local` when no Clerk keys are set (this needs internet access, but no Clerk account);
- generates the Cloudflare binding types and applies the D1 migrations to the local database;
- builds the registry (catalog, previews, thumbnails, Pro payloads in local R2) and the download zips;
- seeds one demo account state: a Team license with a pending seat for `demo+clerk_test@iloveui.dev`.

To run the end-to-end tests, install Playwright's browser once with `pnpm exec playwright install --with-deps chromium`.

## Test a purchase locally

1. Sign up at http://localhost:3000/sign-up with a Clerk test address such as `you+clerk_test@example.com`. Development apps send no email for `+clerk_test` addresses; the verification code is always `424242`.
2. Go to /pricing and choose **Get Pro**. You land on the local test checkout (it says so in a banner). **Pay** sends a signed webhook to `/api/webhooks/local`, which runs the same fulfilment code as the Dodo Payments webhook; **Fail payment** shows the declined state and grants nothing.
3. Back on /account the license shows as active. Open a Pro design, for example /designs/ecommerce/atelier-product-page: the code, the AI prompt and the zip download unlock.
4. On /account, create a CLI token, add the registry entry it shows to a project's `components.json`, put `ILOVEUI_TOKEN=...` in that project's `.env`, and run `npx shadcn@latest add @iloveui/atelier-product-page`.
5. Request a refund on /account. Access ends and the token stops working as soon as the refund event is processed.

Also worth trying: buy **Team**, invite `teammate+clerk_test@example.com`, and sign up as that address to get a seat; or sign up as `demo+clerk_test@iloveui.dev` to activate the seeded demo seat. In development the footer has a region switcher to see dollar and rupee prices (the default comes from `DEV_REGION`, which is `IN`).

## Use real Clerk keys

- To keep the accountless app, claim it into a Clerk account with `pnpm dlx clerk@latest auth login` from the project root. The keys do not change.
- To use your own app, replace `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local` and restart `pnpm dev` (rebuild for `pnpm preview`, which inlines public values at build time). Users from the previous app do not carry over.
- Enable the GitHub and Google social connections in the Clerk dashboard; they need a Clerk account.
- Locally, users are created on their first signed-in request. In production, set `CLERK_WEBHOOK_SIGNING_SECRET` for the `/api/webhooks/clerk` endpoint.

## Use real Dodo Payments test keys

1. In the Dodo Payments dashboard (test mode), create four one-time products: Pro in USD (99) and INR (4,999), Team in USD (299) and INR (14,999).
2. In `.env.local`, set `DODO_PAYMENTS_API_KEY` (a test key), `DODO_PAYMENTS_ENVIRONMENT=test_mode` and the four ids in `DODO_PRODUCT_PRO_USD`, `DODO_PRODUCT_PRO_INR`, `DODO_PRODUCT_TEAM_USD` and `DODO_PRODUCT_TEAM_INR`.
3. Forward webhooks to your machine with the Dodo CLI: `dodo login "$DODO_PAYMENTS_API_KEY" test`, then `dodo wh listen http://localhost:3000/api/webhooks/dodo`. Set `DODO_PAYMENTS_WEBHOOK_KEY` to the secret of the endpoint it creates.
4. Restart `pnpm dev` and pay with the test card `4242 4242 4242 4242`.

As soon as `DODO_PAYMENTS_API_KEY` is set, checkout goes to Dodo Payments and the local test checkout switches off by itself; remove the key to switch back. The local checkout never exists in production builds: `scripts/check-build.ts` fails any build that contains it.

## Commands

| Command                                                        | What it does                                                                                    |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm setup`                                                   | Prepares a fresh clone (environment, Clerk keys, local database, registry, demo seed)           |
| `pnpm dev`                                                     | Builds the registry and the download zips, then starts the development server on port 3000      |
| `pnpm preview`                                                 | Builds for Cloudflare Workers and serves the production build locally on port 3000              |
| `pnpm gates`                                                   | Every quality gate in order: typecheck, lint, unit tests, end-to-end tests, registry validation |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:e2e` | The gates one at a time                                                                         |
| `pnpm lighthouse`                                              | Lighthouse on /, /designs and a design page against a running `pnpm preview`                    |
| `pnpm validate-registry`                                       | Checks every design folder against the authoring contract                                       |
| `pnpm build-registry` · `pnpm build-zips`                      | Rebuild the catalog outputs and the download zips                                               |
| `pnpm design:check <slug>`                                     | Renders one design in every state, width and mode, with accessibility checks and contact sheets |
| `pnpm run deploy`                                              | Builds, checks the build and deploys to Cloudflare Workers (see Going live)                     |

## Adding designs

The authoring contract is [registry/README.md](registry/README.md) and the eight style families are defined in [registry/style-families.md](registry/style-families.md). Each design lives in `registry/designs/<category>/<slug>/` and is checked with `pnpm design:check <slug>` and `pnpm validate-registry --only <slug>`. To add the next batch of 30 Pro designs, run Claude Code in this repository with "Execute BATCH.md" ([BATCH.md](BATCH.md)).

## Going live

Nothing here has been run. When you are ready:

1. **Cloudflare resources.** Run `pnpm exec wrangler login`, then `pnpm exec wrangler d1 create iloveui-db` and copy the `database_id` it prints into the `d1_databases` entry of `wrangler.jsonc`. Create the bucket with `pnpm exec wrangler r2 bucket create iloveui-downloads`.
2. **Database and private files.** Apply the migrations with `pnpm exec wrangler d1 migrations apply iloveui-db --remote`, then upload the Pro payloads and zips with `pnpm build-registry --remote` and `pnpm build-zips --remote`.
3. **Secrets.** Run `pnpm exec wrangler secret put <NAME>` for `TOKEN_PEPPER` (a new random value), `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, `DODO_PAYMENTS_ENVIRONMENT` (`live_mode`) and the four live `DODO_PRODUCT_*` ids. `LOCAL_WEBHOOK_SECRET` and `DEV_REGION` are development only. `NEXT_PUBLIC_SITE_URL` (`https://iloveui.dev`) and the live `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are read at build time, so set them in the environment of the machine that deploys (for example in `.env.production.local`).
4. **Clerk.** Create the production instance for iloveui.dev, add its DNS records in Cloudflare as DNS only (grey cloud), enable GitHub and Google, and add a webhook endpoint at `https://iloveui.dev/api/webhooks/clerk` for `user.created`, `user.updated` and `user.deleted`; its signing secret is `CLERK_WEBHOOK_SIGNING_SECRET`.
5. **Dodo Payments.** Create the four products in live mode, add a webhook endpoint at `https://iloveui.dev/api/webhooks/dodo` for payment, refund and dispute events (its secret is `DODO_PAYMENTS_WEBHOOK_KEY`), switch `DODO_PAYMENTS_ENVIRONMENT` to `live_mode`, and set its refund window to match `REFUND_WINDOW_DAYS` in `lib/licenses.ts` (14 days).
6. **Deploy.** Run `pnpm run deploy`, then attach iloveui.dev to the Worker as a custom domain in the Cloudflare dashboard.

## License

The site and every design are released under the [MIT License](LICENSE).
