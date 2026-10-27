import "../globals.css";
import type { ReactNode } from "react";

// Development-only tools such as the local test checkout. They stand alone like a hosted checkout, without the
// site header and footer; in production every page here is a 404.
export default function DevLayout({ children }: { children: ReactNode }) {
  return children;
}
