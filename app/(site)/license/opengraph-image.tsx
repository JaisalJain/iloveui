import { LEGAL_OG } from "@/components/legal/og-content";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "The iloveui license: MIT. Use it, change it, share it.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage(LEGAL_OG.license);
}
