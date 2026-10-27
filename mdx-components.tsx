import type { MDXComponents } from "mdx/types";
import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";
import { CodeBlock } from "@/components/docs/code-block";
import { Callout, DataTable, TokenTable } from "@/components/docs/prose";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

// Required by @next/mdx in the App Router: maps the Markdown in content/ (docs and changelog) onto the site's
// design system. Fenced code never reaches `pre`/`code` here: lib/mdx/rehype-docs.mjs turns it into <CodeBlock>.

const LINK =
  "font-medium text-fg underline decoration-control decoration-1 underline-offset-[3px] transition-colors duration-160 ease-site hover:decoration-fg";

function Anchor({ href = "", className, children, ...props }: ComponentProps<"a">) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href as Route} className={cn(LINK, className)} {...props}>
        {children}
      </Link>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a href={href} className={cn(LINK, className)} {...props}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} className={cn(LINK, className)} rel="noreferrer" {...props}>
      {children}
    </a>
  );
}

const components = {
  h2: ({ className, ...props }) => (
    <h2 className={cn("mt-16 scroll-mt-24 text-28 font-semibold first:mt-0", className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn("mt-10 scroll-mt-24 text-20 font-semibold", className)} {...props} />
  ),
  h4: ({ className, ...props }) => <h4 className={cn("mt-8 text-16 font-semibold", className)} {...props} />,
  p: ({ className, ...props }) => <p className={cn("mt-4 text-16 text-fg/90", className)} {...props} />,
  a: Anchor,
  strong: ({ className, ...props }) => <strong className={cn("font-semibold text-fg", className)} {...props} />,
  em: ({ className, ...props }) => <em className={cn("italic", className)} {...props} />,
  ul: ({ className, ...props }) => (
    <ul className={cn("mt-4 flex list-disc flex-col gap-2 pl-5 marker:text-muted", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("mt-4 flex list-decimal flex-col gap-2 pl-6 marker:font-mono marker:text-muted", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("pl-1 text-16 text-fg/90 [&>ol]:mt-2 [&>p]:mt-0 [&>ul]:mt-2", className)} {...props} />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded-[4px] border border-hairline bg-raised px-1 py-px font-mono text-[0.875em] [overflow-wrap:anywhere] text-fg",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote className={cn("mt-6 border-l-2 border-hairline pl-4 text-muted", className)} {...props} />
  ),
  hr: ({ className, ...props }) => <hr className={cn("my-12 border-hairline", className)} {...props} />,
  table: ({ className, ...props }) => (
    <div className="mt-6 overflow-hidden rounded-card border border-hairline bg-surface">
      <table className={cn("w-full border-collapse text-left text-14", className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th className={cn("border-b border-hairline px-4 py-3 label-mono font-normal text-muted", className)} {...props} />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border-b border-hairline px-4 py-3 align-top text-muted", className)} {...props} />
  ),
  CodeBlock,
  Callout,
  DataTable,
  TokenTable,
  Kbd,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
