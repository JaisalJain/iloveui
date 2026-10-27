import { notFound } from "next/navigation";

// Unmatched URLs resolve here, inside the site layout, so they get the site's 404 page from (site)/not-found.tsx.
// A root app/not-found.tsx would also work, but Next preloads a root boundary's stylesheet on every document,
// including the preview frames, which must load nothing but their own CSS.
export default function MissingPage() {
  notFound();
}
