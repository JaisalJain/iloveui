import { PREVIEW_BOOT_SCRIPT, THEME_STYLE_ID } from "../../components/preview/protocol";

// Thumbnails run in a real sandbox (allow-scripts only), so their origin is opaque: messages are trusted when they
// come from the parent window, and the frame announces itself so the parent sends the theme and light/dark.
const MESSAGE_SCRIPT = `addEventListener('message',function(e){if(e.source!==parent)return;var d=e.data;if(!d||d.source!=='iloveui')return;if(d.type==='mode')document.documentElement.classList.toggle('dark',d.mode==='dark');if(d.type==='theme'){var s=document.getElementById('${THEME_STYLE_ID}');if(!s){s=document.createElement('style');s.id='${THEME_STYLE_ID}';document.head.appendChild(s)}s.textContent=d.css}});if(parent!==window)parent.postMessage({source:'iloveui-preview',type:'ready'},'*');`;

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * A static, non-interactive rendering of a design's default state for thumbnails (cards, hero wall). It carries the
 * rendered markup only, never the design's source files, and the body is inert so nothing inside takes focus.
 */
export function thumbnailDocument({ name, markup, cssHref }: { name: string; markup: string; cssHref: string }) {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex">',
    `<title>${escapeHtml(name)} · iloveui thumbnail</title>`,
    `<link rel="stylesheet" href="${cssHref}">`,
    `<script>${PREVIEW_BOOT_SCRIPT}${MESSAGE_SCRIPT}</script>`,
    "</head>",
    `<body inert>${markup}</body>`,
    "</html>",
  ].join("");
}
