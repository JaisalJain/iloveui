import type { DesignState } from "@/registry/definitions";
import IndexAccountSettings from "./component";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A full-width settings page: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <IndexAccountSettings key="loading" status="loading" />;
    case "error":
      return (
        <IndexAccountSettings
          key="error"
          status="error"
          errorField="username"
          pendingValues={{ username: "ilse.v", title: "Lead forecast designer", notify: { "digest.push": true } }}
          onSave={async (values) => {
            await wait(900);
            if (values.username === "ilse.v") throw new Error("Couldn't save. The username ilse.v is still taken.");
          }}
        />
      );
    case "success":
      return <IndexAccountSettings key="success" status="success" lastSaved="14:32" />;
    default:
      return <IndexAccountSettings key="default" onSave={() => wait(900)} onDeleteAccount={() => wait(1200)} />;
  }
}
