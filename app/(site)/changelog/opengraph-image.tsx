import { getChangelogEntries } from "@/lib/changelog";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "The iloveui changelog: what changed, and when.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  const [latest] = getChangelogEntries();
  return renderOgImage({
    eyebrow: "Changelog",
    title: "What changed, and",
    emphasis: "when",
    description: latest ? `Latest: ${latest.title}` : "New designs, site features and fixes, newest first.",
    meta: latest ? `Updated ${latest.date}` : undefined,
  });
}
