import type { DesignState } from "@/registry/definitions";
import CushionDialogToasts, { type CushionToast } from "./component";

// The live preview resolves after a believable round trip so the loading button and the toast can be seen.
function schedule() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1100));
}

const STACK: CushionToast[] = [
  {
    id: "scheduled-48-1",
    title: "Issue #48 scheduled",
    description: "Wed 28 Oct, 09:00 · each reader’s time zone",
    tone: "success",
    actionLabel: "Undo",
    duration: 14000,
  },
  {
    id: "test-send",
    title: "Test email sent",
    description: "Delivered to mara@paperlane.email in 1.8 s",
    tone: "success",
    duration: 16000,
  },
  {
    id: "links",
    title: "Link check passed",
    description: "14 links in issue #48, none broken",
    tone: "success",
    duration: 18000,
  },
];

// A full-screen composition: the drafts page, the dialog and the toast stack, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <CushionDialogToasts key={state} defaultOpenIssueId="48" status="loading" />;
    case "error":
      return <CushionDialogToasts key={state} defaultOpenIssueId="48" status="error" onSchedule={schedule} />;
    case "success":
      return (
        <CushionDialogToasts
          key={state}
          defaultScheduled={[{ issueId: "48", dayId: "wed", time: "09:00", readerTimeZone: true }]}
          initialToasts={STACK}
          stackExpanded
          onSchedule={schedule}
        />
      );
    default:
      return <CushionDialogToasts key={state} defaultOpenIssueId="48" onSchedule={schedule} />;
  }
}
