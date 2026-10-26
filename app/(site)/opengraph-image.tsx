import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "iloveui: UI you'll actually ship.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "UI designs for developers",
    title: "UI you'll",
    emphasis: "actually",
    titleEnd: "ship.",
    description: "Hand-built React and HTML designs. Re-theme them to your brand, then copy, install, or download.",
  });
}
