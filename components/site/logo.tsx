import type { SVGProps } from "react";
import {
  HEART_LOBE_LEFT,
  HEART_LOBE_LEFT_TRANSFORM,
  HEART_LOBE_RIGHT,
  HEART_LOBE_RIGHT_TRANSFORM,
  HEART_VIEWBOX,
  WORDMARK_GLYPHS,
  WORDMARK_HEART_TRANSFORM,
  WORDMARK_VIEWBOX,
} from "@/lib/brand";

function HeartLobes() {
  return (
    <>
      <path d={HEART_LOBE_LEFT} transform={HEART_LOBE_LEFT_TRANSFORM} />
      <path d={HEART_LOBE_RIGHT} transform={HEART_LOBE_RIGHT_TRANSFORM} />
    </>
  );
}

/** The iloveui wordmark. Text takes currentColor; the heart is always signal vermilion. */
export function Logo({ title = "iloveui", ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} role="img" aria-label={title} {...props}>
      <path d={WORDMARK_GLYPHS} fill="currentColor" />
      <g transform={WORDMARK_HEART_TRANSFORM} fill="var(--color-heart, #FF4D1F)">
        <g className="logo-heart">
          <HeartLobes />
        </g>
      </g>
    </svg>
  );
}

/** The heart on its own, for small marks and favicons. */
export function HeartMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={HEART_VIEWBOX} aria-hidden fill="var(--color-heart, #FF4D1F)" {...props}>
      <HeartLobes />
    </svg>
  );
}
