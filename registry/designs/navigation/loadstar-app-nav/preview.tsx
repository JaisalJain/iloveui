import type { DesignState } from "@/registry/definitions";
import LoadstarAppNav, { LOADSTAR_DEFAULT_SECTIONS } from "./component";

// A full-viewport app shell, rendered edge to edge.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <LoadstarAppNav status="loading" syncedLabel="Syncing 4 depots" />;
    case "empty": {
      // A quiet morning: no exceptions open and no saved views yet.
      const sections = LOADSTAR_DEFAULT_SECTIONS.map((section) => ({
        ...section,
        items: section.items.map((item) => (item.id === "exceptions" ? { ...item, count: 0 } : item)),
      }));
      return (
        <LoadstarAppNav
          sections={sections}
          savedViews={[]}
          shipments={[]}
          defaultLocation={{ itemId: "exceptions" }}
          unreadNotifications={0}
        />
      );
    }
    default:
      return <LoadstarAppNav />;
  }
}
