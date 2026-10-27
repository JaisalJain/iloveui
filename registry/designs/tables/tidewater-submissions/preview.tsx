import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import TidewaterSubmissions, { DEFAULT_SUBMISSIONS, type TidewaterSubmission } from "./component";

// After a bulk shortlist: the three pieces carry the accent diamond and the colophon confirms with Undo.
const SHORTLISTED = new Set(["s-418", "s-417", "s-414"]);
const afterShortlist: TidewaterSubmission[] = DEFAULT_SUBMISSIONS.map((item) =>
  SHORTLISTED.has(item.id) ? { ...item, status: "shortlisted" } : item,
);

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <PreviewCanvas align="start" width="xl">
          <TidewaterSubmissions status="loading" />
        </PreviewCanvas>
      );
    case "empty":
      return (
        <PreviewCanvas align="start" width="xl">
          <TidewaterSubmissions
            submissions={[]}
            standfirst="Every piece for the winter issue has a decision. The issue closes on 14 November."
          />
        </PreviewCanvas>
      );
    case "success":
      return (
        <PreviewCanvas align="start" width="xl">
          <TidewaterSubmissions submissions={afterShortlist} initialNotice="Three pieces moved to the shortlist." />
        </PreviewCanvas>
      );
    default:
      // Two pieces start selected so the margin rules and the prose summary show on first paint.
      return (
        <PreviewCanvas align="start" width="xl">
          <TidewaterSubmissions defaultSelected={["s-417", "s-415"]} />
        </PreviewCanvas>
      );
  }
}
