import "../globals.css";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { monetizationEnabled } from "@/lib/monetization";

// Development-only tools such as the local test checkout. They stand alone like a hosted checkout, without the
// site header and footer; in production, and whenever monetization is off, every page here is a 404.
export default function DevLayout({ children }: { children: ReactNode }) {
  if (!monetizationEnabled()) notFound();
  return children;
}
