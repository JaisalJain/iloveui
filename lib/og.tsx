import { ImageResponse } from "next/og";
import instrumentSerifItalic from "@/assets/fonts/instrument-serif-italic.ttf";
import interTight400 from "@/assets/fonts/inter-tight-400.ttf";
import interTight600 from "@/assets/fonts/inter-tight-600.ttf";
import jetbrainsMono500 from "@/assets/fonts/jetbrains-mono-500.ttf";
import {
  HEART_COLOR,
  HEART_LOBE_LEFT,
  HEART_LOBE_LEFT_TRANSFORM,
  HEART_LOBE_RIGHT,
  HEART_LOBE_RIGHT_TRANSFORM,
  WORDMARK_ASPECT,
  WORDMARK_GLYPHS,
  WORDMARK_HEART_TRANSFORM,
  WORDMARK_VIEWBOX,
} from "@/lib/brand";
import { site } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#EDEDED";
const MUTED = "#A1A1A6";
const CANVAS = "#0B0B0C";
const HAIRLINE = "rgba(255,255,255,0.08)";

function buffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

function Wordmark({ height }: { height: number }) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} width={Math.round(height * WORDMARK_ASPECT)} height={height}>
      <path d={WORDMARK_GLYPHS} fill={INK} />
      <g transform={WORDMARK_HEART_TRANSFORM} fill={HEART_COLOR}>
        <path d={HEART_LOBE_LEFT} transform={HEART_LOBE_LEFT_TRANSFORM} />
        <path d={HEART_LOBE_RIGHT} transform={HEART_LOBE_RIGHT_TRANSFORM} />
      </g>
    </svg>
  );
}

export type OgContent = {
  /** Small mono label above the title, e.g. "Pricing" or a design's category. */
  eyebrow: string;
  /** Title text before the emphasized phrase. */
  title: string;
  /** Optional phrase set in Instrument Serif italic, appended to the title. */
  emphasis?: string;
  /** Optional text after the emphasized phrase. */
  titleEnd?: string;
  /** One line of supporting copy. */
  description?: string;
  /** Mono metadata shown bottom right, e.g. "Free · 2.4 kB gzip". */
  meta?: string;
};

/** The shared 1200x630 base every route's Open Graph image is drawn from. */
export function renderOgImage({ eyebrow, title, emphasis, titleEnd, description, meta }: OgContent) {
  const length = title.length + (emphasis?.length ?? 0) + (titleEnd?.length ?? 0);
  const titleSize = length > 42 ? 64 : length > 26 ? 80 : 96;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: CANVAS,
        color: INK,
        padding: "64px 72px",
        fontFamily: "Inter Tight",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark height={40} />
        <div
          style={{
            display: "flex",
            fontFamily: "JetBrains Mono",
            fontSize: 22,
            color: MUTED,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            fontSize: titleSize,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            maxWidth: 1000,
          }}
        >
          <span>{title}</span>
          {emphasis ? (
            <span
              style={{
                fontFamily: "Instrument Serif",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                marginLeft: titleSize * 0.22,
              }}
            >
              {emphasis}
            </span>
          ) : null}
          {titleEnd ? <span style={{ marginLeft: titleSize * 0.22 }}>{titleEnd}</span> : null}
        </div>
        {description ? (
          <div
            style={{ display: "flex", fontSize: 28, fontWeight: 400, color: MUTED, maxWidth: 880, lineHeight: 1.35 }}
          >
            {description}
          </div>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${HAIRLINE}`,
          paddingTop: 24,
          fontFamily: "JetBrains Mono",
          fontSize: 20,
          color: MUTED,
        }}
      >
        <span>{site.repository.replace(/^https:\/\//, "")}</span>
        <span>{meta ?? "React + HTML · Tailwind v4 · Re-themeable"}</span>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter Tight", data: buffer(interTight400), weight: 400, style: "normal" },
        { name: "Inter Tight", data: buffer(interTight600), weight: 600, style: "normal" },
        { name: "Instrument Serif", data: buffer(instrumentSerifItalic), weight: 400, style: "italic" },
        { name: "JetBrains Mono", data: buffer(jetbrainsMono500), weight: 500, style: "normal" },
      ],
    },
  );
}
