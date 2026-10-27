import { DOCK_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/theme-storage";
import { PENDING_ATTRIBUTE, ThemeLabActivator } from "./activator";
import { StaticDock } from "./static-dock";
import { THEME_LAB_CSS } from "./views";

// Runs before the static dock paints on a first load: a visitor with a stored theme or dock state would otherwise
// see the defaults for a moment, so the static dock stays hidden until the real one (with their values) replaces it.
const PENDING_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})!==null||localStorage.getItem(${JSON.stringify(
  DOCK_STORAGE_KEY,
)})!==null)document.documentElement.setAttribute(${JSON.stringify(PENDING_ATTRIBUTE)},"")}catch(e){}`;

/**
 * Theme Lab: re-skins every preview frame on the page with the buyer's brand. Sticky to the bottom of the viewport
 * while the page scrolls, then comes to rest at the end of the content, so it never covers the last row or the footer.
 * Phones (below 640px) get a Theme button that opens the same controls in a bottom sheet.
 * The server renders it as static markup with no JavaScript; the interactive dock loads on intent (see ./activator).
 */
export function ThemeLabDock() {
  return (
    <div
      data-theme-lab=""
      className="pointer-events-none sticky bottom-0 z-40 flex h-[88px] items-end justify-center px-4 pb-4 pointer-coarse:h-[96px]"
    >
      <style>{THEME_LAB_CSS}</style>
      {/* Inside markup so the HTML parser runs it on first load; on client navigation the activator does the same. */}
      <div hidden dangerouslySetInnerHTML={{ __html: `<script>${PENDING_SCRIPT}</script>` }} />
      <ThemeLabActivator>
        <StaticDock />
      </ThemeLabActivator>
    </div>
  );
}
