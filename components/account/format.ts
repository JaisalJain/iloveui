// Dates on the account page are formatted on the server in UTC, so the client islands receive finished strings and
// hydration never disagrees about a time zone.

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/** "27 Oct 2026" */
export function formatDate(date: Date): string {
  return DATE.format(date);
}

/** "27 Oct 2026, 15:04 UTC" */
export function formatDateTime(date: Date): string {
  return `${DATE_TIME.format(date)} UTC`;
}
