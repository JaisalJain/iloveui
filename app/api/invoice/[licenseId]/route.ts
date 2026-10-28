import { eq } from "drizzle-orm";
import { PAID_PLANS, formatPrice } from "@/config/pricing";
import { getViewer, monetizationOff, signInRequired } from "@/lib/auth";
import { monetizationEnabled } from "@/lib/monetization";
import { getDb } from "@/lib/db";
import { licenses } from "@/lib/db/schema";
import { getPaymentProvider } from "@/lib/payments/provider";
import { json } from "@/lib/payments/request";
import { site } from "@/lib/site";

// GET /api/invoice/<licenseId>: the owner's invoice. Dodo Payments issues the real invoice
// and we stream its PDF. Local test purchases get a plainly labelled test receipt, in development only.

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function localReceipt(license: typeof licenses.$inferSelect, email: string): string {
  const plan = PAID_PLANS[license.plan];
  const amount = formatPrice(license.amountMinor, license.currency);
  const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(license.createdAt);
  const rows: [string, string][] = [
    ["Receipt", license.id],
    ["Date", date],
    ["Billed to", email],
    ["Payment", license.providerPaymentId],
    ["Status", license.status === "active" ? "Paid" : "Refunded"],
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Local test receipt · ${escape(site.name)}</title>
<style>
:root{color-scheme:light dark;--canvas:#F5F3EF;--surface:#FFFFFF;--text:#111111;--muted:#5C5C62;--hairline:rgba(0,0,0,.08);--accent:oklch(53.75% 0.19 34.59)}
@media (prefers-color-scheme:dark){:root{--canvas:#0B0B0C;--surface:#121214;--text:#EDEDED;--muted:#A1A1A6;--hairline:rgba(255,255,255,.08);--accent:oklch(66.86% 0.2211 34.59)}}
*{box-sizing:border-box}
body{margin:0;background:var(--canvas);color:var(--text);font:16px/1.55 ui-sans-serif,system-ui,sans-serif}
main{max-width:640px;margin:48px auto;padding:0 16px}
.card{background:var(--surface);border:1px solid var(--hairline);border-radius:10px;padding:32px}
.banner{font:12px/1.5 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin:0 0 24px}
h1{font-size:28px;letter-spacing:-.03em;margin:0 0 4px}
p{margin:0;color:var(--muted);font-size:14px}
dl{display:grid;grid-template-columns:max-content 1fr;gap:8px 24px;margin:32px 0;font-size:14px}
dt{color:var(--muted)}
dd{margin:0;font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:12px 0;border-top:1px solid var(--hairline)}
th[scope=col]{color:var(--muted);font-weight:400}
.num{text-align:right;font-variant-numeric:tabular-nums}
tfoot td,tfoot th{font-weight:600}
button{margin-top:24px;font:inherit;font-size:14px;min-height:40px;padding:0 16px;border-radius:6px;border:1px solid var(--hairline);background:var(--surface);color:var(--text);cursor:pointer}
button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media print{button{display:none}body{background:#fff;color:#000}main{margin:0}}
</style>
</head>
<body>
<main>
<div class="card">
<p class="banner">Local test receipt, not a tax invoice</p>
<h1>${escape(site.name)} ${escape(plan.name)}</h1>
<p>This purchase went through the local test checkout on a development server. No money moved. In production, the payment provider issues the invoice.</p>
<dl>${rows.map(([term, value]) => `<dt>${escape(term)}</dt><dd>${escape(value)}</dd>`).join("")}</dl>
<table>
<thead><tr><th scope="col">Item</th><th scope="col" class="num">Amount</th></tr></thead>
<tbody><tr><td>${escape(plan.name)}, lifetime license (${plan.seats === 1 ? "1 person" : `up to ${plan.seats} people`})</td><td class="num">${escape(amount)}</td></tr></tbody>
<tfoot><tr><th scope="row">Total (${escape(license.currency)})</th><td class="num">${escape(amount)}</td></tr></tfoot>
</table>
<button type="button" onclick="window.print()">Print receipt</button>
</div>
</main>
</body>
</html>`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ licenseId: string }> }) {
  if (!monetizationEnabled()) return monetizationOff();
  const viewer = await getViewer();
  if (!viewer) return signInRequired();
  const { licenseId } = await params;
  const license = await getDb().select().from(licenses).where(eq(licenses.id, licenseId)).get();
  const notFound = () => json({ error: "not_found", message: "No invoice for that license." }, 404);
  if (!license || license.ownerUserId !== viewer.id) return notFound();

  if (license.provider === "local") {
    if (process.env.NODE_ENV !== "development") return notFound();
    return new Response(localReceipt(license, viewer.email), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" },
    });
  }

  const provider = await getPaymentProvider();
  if (!provider || provider.id !== "dodo") return notFound();
  const invoice = await provider.getInvoice(license.providerPaymentId);
  if (!invoice?.ok || !invoice.body) return notFound();
  return new Response(invoice.body, {
    headers: {
      "content-type": invoice.headers.get("content-type") ?? "application/pdf",
      "content-disposition": `inline; filename="iloveui-invoice-${license.id}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
