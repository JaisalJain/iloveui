import type { ComponentProps } from "react";
import type { ClerkProvider } from "@clerk/nextjs";

type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>;

// Clerk reads the site tokens through CSS variables, so the T-key theme toggle restyles it with no JavaScript and
// light and dark stay the deliberate pair defined in app/globals.css. Clerk derives its shades with color-mix().
export const clerkAppearance: Appearance = {
  // Tailwind v4 utilities must win over Clerk's styles: the layer order is declared at the top of globals.css.
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "var(--color-accent-fill)",
    colorPrimaryForeground: "var(--color-accent-fg)",
    colorBackground: "var(--color-surface)",
    colorForeground: "var(--color-fg)",
    colorMuted: "var(--color-raised)",
    colorMutedForeground: "var(--color-muted)",
    colorInput: "var(--color-canvas)",
    colorInputForeground: "var(--color-fg)",
    colorBorder: "var(--color-control)",
    colorRing: "var(--color-accent)",
    colorNeutral: "var(--color-fg)",
    colorDanger: "var(--color-danger)",
    // One accent on the site (spec 7.1): Clerk's orange warning tone (the development-mode badge) uses it too.
    colorWarning: "var(--color-accent)",
    colorShadow: "var(--color-black)",
    // Clerk sweeps a highlight across buttons on hover; spec 7.1 rules that decoration out, so it draws nothing.
    colorShimmer: "transparent",
    fontFamily: "var(--font-inter-tight), ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-inter-tight), ui-sans-serif, system-ui, sans-serif",
    fontFamilyMono: "var(--font-jetbrains-mono), ui-monospace, monospace",
    fontSize: "0.875rem",
    borderRadius: "6px",
  },
  options: {
    logoPlacement: "none",
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    // Our card draws the frame; Clerk's raised card would add a second border and a stronger shadow.
    elevation: "flush",
    privacyPageUrl: "/privacy",
  },
  elements: {
    // Fill our card instead of Clerk's fixed 25rem, so nothing overflows at 375px.
    rootBox:
      "w-full [&_:is(a,button,input):focus-visible]:outline-2 [&_:is(a,button,input):focus-visible]:outline-offset-2 [&_:is(a,button,input):focus-visible]:outline-accent",
    cardBox: "w-full max-w-full",
    card: "w-full",
    // The page heading introduces the first step; later steps (check your email, verify) keep Clerk's heading.
    header: "[.cl-signIn-start_&]:hidden [.cl-signUp-start_&]:hidden",
    // Controls match the site's own: 3:1 boundaries and the two shadow tokens only. The rootBox rule restates the
    // global 2px accent focus outline, because Clerk's layer comes after the base layer and draws rings as shadows.
    formFieldInput: "border border-control shadow-none",
    otpCodeFieldInput: "border border-control shadow-none",
    socialButtonsBlockButton: "border border-hairline bg-surface shadow-sm hover:bg-raised",
    formButtonPrimary: "shadow-sm",
    // accent-fill is tuned for white text on a fill; accent keeps 4.5:1 as text on the card in both themes.
    footerActionLink: "text-accent hover:text-accent",
  },
};

// Clerk fills {{applicationName}} from the instance settings, which an accountless development app cannot rename.
const CONTINUE = "to continue to iloveui";

export const clerkLocalization = {
  signIn: {
    start: { title: "Sign in to iloveui", titleCombined: "Continue to iloveui" },
    emailCode: { subtitle: CONTINUE },
    emailCodeMfa: { subtitle: CONTINUE },
    emailLink: { subtitle: CONTINUE },
    emailLinkMfa: { subtitle: CONTINUE },
    phoneCode: { subtitle: CONTINUE },
    alternativePhoneCodeProvider: { subtitle: CONTINUE },
  },
  signUp: {
    start: { title: "Create your iloveui account" },
    emailLink: { subtitle: CONTINUE },
  },
};
