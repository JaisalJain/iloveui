import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { catalogOg } from "@/lib/og-content";

export const alt = "iloveui designs: React and HTML UI you can re-theme and ship.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage(catalogOg());
}
