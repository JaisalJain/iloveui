import { LEGAL_OG } from "@/components/legal/og-content";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "iloveui refunds: full refund within 14 days, no questions asked.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage(LEGAL_OG.refunds);
}
