import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you asked for does not exist on iloveui.",
};

export default function SiteNotFound() {
  return <NotFoundContent />;
}
