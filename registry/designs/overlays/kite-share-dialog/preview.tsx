import type { DesignState } from "@/registry/definitions";
import KiteShareDialog, { type KiteMember, type KitePerson } from "./component";

// The live preview resolves after a believable round trip so the Sending state can be seen.
function invite() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1000));
}

const CHIARA: KitePerson = {
  name: "Chiara Benedetti",
  email: "chiara@lumenfold.studio",
  title: "Lumenfold Studio",
  guest: true,
};
const DEV: KitePerson = { name: "Dev Raghunathan", email: "dev@kitebook.design", title: "Brand lead" };

const AFTER_INVITE: KiteMember[] = [
  { name: "Noa Feld", email: "noa@kitebook.design", role: "owner" },
  { name: "Amara Osei", email: "amara@kitebook.design", role: "edit" },
  { name: "Tomasz Wrona", email: "tomasz@kitebook.design", role: "comment" },
  { ...CHIARA, role: "comment", pending: true },
  { ...DEV, role: "comment", pending: true },
];

// A full-screen composition: the board page with the share dialog open over it.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <KiteShareDialog key={state} defaultOpen defaultInvitees={[CHIARA, DEV]} status="sending" />;
    case "error":
      return (
        <KiteShareDialog key={state} defaultOpen defaultInvitees={[CHIARA, DEV]} status="error" onInvite={invite} />
      );
    case "success":
      return (
        <KiteShareDialog
          key={state}
          defaultOpen
          members={AFTER_INVITE}
          initialToast={{ id: "sent", kind: "invite", text: "2 invites sent" }}
          onInvite={invite}
        />
      );
    default:
      return <KiteShareDialog key={state} defaultOpen defaultInvitees={[CHIARA]} onInvite={invite} />;
  }
}
