import { replaceTokenBlock, THEME_FILE_NAME, themeFile } from "./code";
import { normalizeTheme, themeCss, type ThemeState } from "./theme";
import { createZip, readZip } from "./zip";

// Per-design zip downloads carry the buyer's Theme Lab tokens (spec 7.4): component.html gets its token block
// replaced and a theme.css joins the archive. The query string mirrors ThemeState and is validated field by field.

export const DOWNLOAD_THEME_PARAMS = ["accent", "neutral", "radius", "font", "density"] as const;

/** Theme Lab values from ?accent=FF4D1F&neutral=zinc&radius=10&font=geist&density=compact; defaults fill gaps. */
export function themeFromSearchParams(params: URLSearchParams): ThemeState {
  const radius = params.get("radius");
  return normalizeTheme({
    accent: params.get("accent") ?? undefined,
    neutral: params.get("neutral") ?? undefined,
    radius: radius !== null && radius.trim() !== "" ? Number(radius) : undefined,
    font: params.get("font") ?? undefined,
    density: params.get("density") ?? undefined,
  });
}

/** The query string the design page appends to a download link for the current theme. */
export function themeSearchParams(theme: ThemeState): URLSearchParams {
  return new URLSearchParams({
    accent: theme.accent.replace(/^#/, ""),
    neutral: theme.neutral,
    radius: String(theme.radius),
    font: theme.font,
    density: theme.density,
  });
}

/** The file name a design's zip is saved under. Slugs are validated kebab-case, so the name needs no escaping. */
export function downloadFileName(slug: string): string {
  return `iloveui-${slug}.zip`;
}

/** Rewrites a built design zip with the theme: tokens in component.html, plus theme.css next to the component. */
export function themeZip(archive: Uint8Array, theme: ThemeState): Uint8Array {
  const css = themeCss(theme);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const entries = readZip(archive);
  const root = entries[0]?.name.includes("/") ? entries[0].name.slice(0, entries[0].name.indexOf("/") + 1) : "";
  const themed = entries
    .filter((entry) => entry.name !== `${root}${THEME_FILE_NAME}`)
    .map((entry) =>
      entry.name.endsWith("component.html")
        ? { name: entry.name, data: encoder.encode(replaceTokenBlock(decoder.decode(entry.data), css)) }
        : entry,
    );
  const htmlIndex = themed.findIndex((entry) => entry.name.endsWith("component.html"));
  themed.splice(htmlIndex + 1, 0, { name: `${root}${THEME_FILE_NAME}`, data: encoder.encode(themeFile(css)) });
  return createZip(themed);
}
