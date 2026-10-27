import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import QuorumWorkspaceSettings, { type QuorumMember } from "./component";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const PROMOTED: QuorumMember[] = [
  { id: "m1", name: "Priya Natarajan", email: "priya@fernhill.dev", role: "owner", lastActive: "Now", twoFactor: true },
  {
    id: "m2",
    name: "Jonas Åberg",
    email: "jonas@fernhill.dev",
    role: "admin",
    lastActive: "12 min ago",
    twoFactor: true,
  },
  { id: "m3", name: "Noor Haddad", email: "noor@fernhill.dev", role: "member", lastActive: "2 h ago", twoFactor: true },
  {
    id: "m4",
    name: "Tomasz Wilk",
    email: "tomasz@fernhill.dev",
    role: "member",
    lastActive: "Yesterday",
    twoFactor: false,
  },
  { id: "m5", name: "Ama Owusu", email: "ama@fernhill.dev", role: "member", lastActive: "Mon 26 Oct", twoFactor: true },
  {
    id: "m7",
    name: "Rei Takahashi",
    email: "rei@fernhill.dev",
    role: "viewer",
    lastActive: "Invited 24 Oct",
    twoFactor: false,
    invited: true,
  },
];

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <PreviewCanvas width="xl" align="start">
          <QuorumWorkspaceSettings key="loading" status="loading" />
        </PreviewCanvas>
      );
    case "error":
      return (
        <PreviewCanvas width="xl" align="start">
          <QuorumWorkspaceSettings
            key="error"
            status="error"
            pendingChanges={[
              { memberId: "m3", role: "member" },
              { memberId: "m6", remove: true },
            ]}
            onApply={() => wait(900)}
          />
        </PreviewCanvas>
      );
    case "success":
      return (
        <PreviewCanvas width="xl" align="start">
          <QuorumWorkspaceSettings
            key="success"
            status="success"
            members={PROMOTED}
            appliedAt="14:32"
            pendingChanges={[
              { memberId: "m3", role: "member", from: "viewer", name: "Noor Haddad" },
              { memberId: "m6", remove: true, from: "member", name: "Felix Brandt" },
            ]}
          />
        </PreviewCanvas>
      );
    case "empty":
      return (
        <PreviewCanvas width="xl" align="start">
          <QuorumWorkspaceSettings key="empty" apiKeys={[]} />
        </PreviewCanvas>
      );
    default:
      return (
        <PreviewCanvas width="xl" align="start">
          <QuorumWorkspaceSettings key="default" onApply={() => wait(900)} />
        </PreviewCanvas>
      );
  }
}
