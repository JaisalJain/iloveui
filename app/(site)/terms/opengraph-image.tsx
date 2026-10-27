import { LEGAL_OG } from "@/components/legal/og-content";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "iloveui terms of sale and use.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage(LEGAL_OG.terms);
}
