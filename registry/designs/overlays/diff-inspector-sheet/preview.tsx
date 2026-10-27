import type { DesignState } from "@/registry/definitions";
import DiffInspectorSheet, { DIFF_SUPPLIERS } from "./component";

// The live preview resolves after a believable round trip so the Saving state can be seen.
function save() {
  return new Promise<void>((resolve) => setTimeout(resolve, 900));
}

const EDITS = { terms: "45", creditLimit: "48000" } as const;

// A full-screen composition: the supplier table with the inspector open over it.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <DiffInspectorSheet key={state} defaultOpenId="sup-0418" defaultEdits={EDITS} status="saving" />;
    case "error":
      return (
        <DiffInspectorSheet
          key={state}
          defaultOpenId="sup-0418"
          defaultEdits={{ ...EDITS, email: "ap@brightwater-textiles", creditLimit: "260000" }}
          status="error"
          onSave={save}
        />
      );
    case "success":
      return (
        <DiffInspectorSheet
          key={state}
          suppliers={DIFF_SUPPLIERS.map((supplier, index) =>
            index === 0 ? { ...supplier, values: { ...supplier.values, ...EDITS } } : supplier,
          )}
          defaultOpenId="sup-0418"
          status="saved"
          onSave={save}
        />
      );
    default:
      return <DiffInspectorSheet key={state} defaultOpenId="sup-0418" defaultEdits={EDITS} onSave={save} />;
  }
}
