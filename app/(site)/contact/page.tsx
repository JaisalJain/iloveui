import { ArrowUpRight, Bug, FileText, ReceiptText, Undo2 } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Emphasis, RelatedPages } from "@/components/legal/legal-page";
import { site } from "@/lib/site";

const description = `Reach the person who builds iloveui at ${site.supportEmail}: what to include for license, refund, invoice and bug questions, and when to expect a reply.`;

export const metadata: Metadata = {
  title: "Contact",
  description,
  alternates: { canonical: "/contact" },
  openGraph: { title: `Contact · ${site.name}`, description, url: "/contact" },
};

const mailto = (subject: string) => `mailto:${site.supportEmail}?subject=${encodeURIComponent(subject)}`;

const TOPICS: { id: string; title: string; icon: ReactNode; subject: string; action: string; include: string[] }[] = [
  {
    id: "license",
    title: "License question",
    icon: <FileText size={16} strokeWidth={1.5} aria-hidden />,
    subject: "License question",
    action: "Email a license question",
    include: [
      "What you are building and who it is for",
      "Which designs you want to use",
      "How the result reaches people: a site, an app, a template",
    ],
  },
  {
    id: "refund",
    title: "Refund",
    icon: <Undo2 size={16} strokeWidth={1.5} aria-hidden />,
    subject: "Refund request",
    action: "Ask for a refund",
    include: [
      "Send it from the email you bought with",
      "The purchase date, or the payment id from your invoice",
      "No reason needed",
    ],
  },
  {
    id: "invoice",
    title: "Invoice or payment",
    icon: <ReceiptText size={16} strokeWidth={1.5} aria-hidden />,
    subject: "Invoice question",
    action: "Email an invoice question",
    include: [
      "The email you bought with",
      "The payment id or the DODOPAY_ line on your statement",
      "What needs changing, such as a company name or tax id",
    ],
  },
  {
    id: "bug",
    title: "Bug in a design",
    icon: <Bug size={16} strokeWidth={1.5} aria-hidden />,
    subject: "Bug report",
    action: "Report a bug",
    include: [
      "The design’s page link and the React or HTML version",
      "Browser, viewport width, and light or dark mode",
      "What you expected, what happened, and the steps to get there",
    ],
  },
];

export default function ContactPage() {
  return (
    <div className="page-frame pt-16 pb-8 sm:pt-24">
      <header className="max-w-3xl">
        <p className="label-mono text-muted">Contact</p>
        <h1 className="mt-4 text-40 font-semibold sm:text-64">
          Write to a <Emphasis>person.</Emphasis>
        </h1>
        <p className="mt-6 max-w-2xl text-16 text-muted sm:text-20">
          {site.name} is built and run by {site.owner.name} in {site.owner.country}, who reads and answers every email
          personally.
        </p>
      </header>

      <section aria-labelledby="email-heading" className="mt-12 grid gap-8 sm:mt-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="rounded-card border border-hairline bg-surface p-6 shadow-sm sm:p-8">
            <h2 id="email-heading" className="label-mono text-muted">
              Email
            </h2>
            <a
              href={`mailto:${site.supportEmail}`}
              className="group mt-4 inline-flex min-h-10 max-w-full items-center gap-2 rounded-control text-20 font-medium break-all text-fg sm:text-28"
            >
              <span className="underline decoration-control underline-offset-[6px] transition-colors duration-160 ease-site group-hover:decoration-fg">
                {site.supportEmail}
              </span>
              <ArrowUpRight size={20} strokeWidth={1.5} aria-hidden className="shrink-0 text-muted" />
            </a>
            <p className="mt-4 text-14 text-muted">
              One address for everything. There is no contact form and no ticket queue; a plain email with the details
              below gets the fastest answer.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <h2 className="text-20 font-semibold sm:text-28">What to include</h2>
          <p className="mt-2 max-w-xl text-14 text-muted">
            Pick the closest topic. Each link opens an email with the subject filled in.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {TOPICS.map((topic) => (
              <li key={topic.id} className="flex flex-col rounded-card border border-hairline bg-surface p-5 shadow-sm">
                <h3 id={`topic-${topic.id}`} className="flex items-center gap-2 text-16 font-medium">
                  <span className="text-muted">{topic.icon}</span>
                  {topic.title}
                </h3>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {topic.include.map((line) => (
                    <li key={line} className="flex gap-2.5 text-14 text-muted">
                      <span aria-hidden className="mt-[0.72em] h-px w-2.5 shrink-0 bg-control" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={mailto(topic.subject)}
                  className="mt-4 inline-flex min-h-10 items-center gap-1.5 self-start rounded-control text-14 font-medium text-fg underline decoration-control underline-offset-4 transition-colors duration-160 ease-site hover:decoration-fg pointer-fine:min-h-6"
                >
                  {topic.action}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <RelatedPages
        links={[
          { href: "/docs", label: "Docs", description: "Installation, the CLI, theming and AI prompts." },
          { href: "/license", label: "License", description: "MIT: use, change and share the designs." },
        ]}
      />
    </div>
  );
}
