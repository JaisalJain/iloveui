import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to iloveui to reach your Pro license, your CLI token and your bookmarks.",
  alternates: { canonical: "/sign-in" },
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <AuthPage
      eyebrow="Sign in"
      title={
        <>
          Back to <em className="font-serif font-normal tracking-normal">building.</em>
        </>
      }
      fields={1}
      lead="Your account holds your license, your CLI token and your bookmarks."
    >
      <SignIn />
    </AuthPage>
  );
}
