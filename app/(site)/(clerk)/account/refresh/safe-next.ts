const FALLBACK = "/account";

/**
 * The path to continue to after /account/refresh, or /account. Only same-site paths pass: they start with one "/",
 * contain no backslash or control character (browsers treat "\" as "/", so "/\evil.dev" is protocol-relative) and
 * still resolve to the site's own origin.
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return FALLBACK;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return FALLBACK;
  const base = "https://iloveui.invalid";
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return FALLBACK;
  }
  if (url.origin !== base) return FALLBACK;
  return `${url.pathname}${url.search}${url.hash}`;
}
