"use client";

// Replaces the root layout when it fails, so it renders its own document. Its styles are inline on purpose: Next
// preloads every stylesheet this file imports on every page, including the preview frames that never use them.
// The values are the site tokens from app/globals.css. The font families are next/font's names for lib/fonts.ts, set
// here rather than imported: this file ships with every page, and the font module would add 1.4 kB gzipped to each.
const STYLES = `
:root{color-scheme:light dark;--font-inter-tight:'interTight','interTight Fallback';--font-jetbrains-mono:'jetbrainsMono','jetbrainsMono Fallback';--canvas:oklch(96.46% 0.0057 84.57);--fg:oklch(17.76% 0 0);--muted:oklch(47.69% 0.0095 286.03);--accent-fill:oklch(58.5% 0.205 34.59);--accent:oklch(53.75% 0.19 34.59)}
@media (prefers-color-scheme:dark){:root{--canvas:oklch(15% 0.0021 286.14);--fg:oklch(94.61% 0 0);--muted:oklch(71.05% 0.0072 286.22);--accent:oklch(66.86% 0.2211 34.59)}}
body{margin:0;background:var(--canvas);color:var(--fg);font-family:var(--font-inter-tight),ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
main{box-sizing:border-box;min-height:100dvh;max-width:93rem;margin:0 auto;padding:4rem 1rem;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}
@media (min-width:640px){main{padding-inline:1.5rem}}
.label{margin:0;font-family:var(--font-jetbrains-mono),ui-monospace,monospace;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
h1{margin:1rem 0 0;max-width:42rem;font-size:2.5rem;line-height:1.05;letter-spacing:-.03em;font-weight:600;text-wrap:balance}
@media (min-width:640px){h1{font-size:4rem;line-height:1}}
.body{margin:1.5rem 0 0;max-width:32rem;font-size:1rem;line-height:1.55;color:var(--muted);text-wrap:pretty}
button{margin-top:2.5rem;height:3rem;padding:0 1.5rem;border:0;border-radius:6px;background:var(--accent-fill);color:#fff;font:inherit;font-weight:500;cursor:pointer}
button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
`;

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong · iloveui</title>
        <style>{STYLES}</style>
      </head>
      <body>
        <main>
          <p className="label">Something went wrong</p>
          <h1>iloveui failed to load.</h1>
          <p className="body">The page hit an unexpected error. Reload to try again.</p>
          <button type="button" onClick={() => retry()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
