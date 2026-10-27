import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free iloveui account to save bookmarks, then unlock every Pro design with one payment.",
  alternates: { canonical: "/sign-up" },
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return (
    <AuthPage
      eyebrow="Create an account"
      title={
        <>
          Make the catalog <em className="font-serif font-normal tracking-normal">yours.</em>
        </>
      }
      fields={2}
      lead="An account is free. It keeps your bookmarks, and after checkout it holds your Pro license and CLI token."
    >
      <SignUp />
    </AuthPage>
  );
}
