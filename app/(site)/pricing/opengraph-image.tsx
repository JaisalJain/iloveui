import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { pricingOg } from "@/lib/og-content";

export const alt = "iloveui pricing: pay once, keep every design.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage(pricingOg());
}
