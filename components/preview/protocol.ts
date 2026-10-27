// Messages between the site (Theme Lab, preview stage, cards) and preview iframes. Both sides are same-origin;
// every listener checks the origin and the message source.

export const PARENT_SOURCE = "iloveui";
export const FRAME_SOURCE = "iloveui-preview";

export type ParentMessage =
  | { source: typeof PARENT_SOURCE; type: "theme"; css: string }
  | { source: typeof PARENT_SOURCE; type: "mode"; mode: "light" | "dark" }
  | { source: typeof PARENT_SOURCE; type: "state"; state: string }
  | { source: typeof PARENT_SOURCE; type: "replay" };

export type FrameMessage = { source: typeof FRAME_SOURCE; type: "ready" };

export const THEME_STYLE_ID = "iu-theme";

/**
 * Inline script for preview documents (React previews and static thumbnails): applies light/dark from ?mode= or
 * the site's stored choice, and the stored Theme Lab tokens, before first paint. A string literal on purpose.
 */
export const PREVIEW_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,q=new URLSearchParams(location.search),m=q.get('mode');if(m!=='light'&&m!=='dark'){var s=localStorage.getItem('iloveui.mode');m=s==='light'||s==='dark'?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}d.classList.toggle('dark',m==='dark');var t=JSON.parse(localStorage.getItem('iloveui.theme')||'null');if(t&&typeof t.css==='string'){var e=document.createElement('style');e.id='${THEME_STYLE_ID}';e.textContent=t.css;document.head.appendChild(e)}}catch(e){}})();`;

/** Applies Theme Lab CSS inside a preview document. */
export function applyThemeCss(css: string) {
  let style = document.getElementById(THEME_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = THEME_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
}

export function isParentMessage(value: unknown): value is ParentMessage {
  return typeof value === "object" && value !== null && (value as { source?: unknown }).source === PARENT_SOURCE;
}
