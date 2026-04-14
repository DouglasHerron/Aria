import type { Metadata } from "next";

import { SetupWizardClient } from "@/components/SetupWizardClient";

export const metadata: Metadata = {
  title: "ARIA — Setup",
  description: "Configure ARIA environment variables",
};

export default function SetupPage() {
  const isVercel = !!process.env.VERCEL;
  const deploymentUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">ARIA setup</h1>
        {isVercel ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Running on Vercel — set environment variables in your{" "}
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Vercel project settings
            </a>{" "}
            and redeploy to apply changes.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Values are saved to <code className="rounded bg-muted px-1">.env.local</code> in this
            project. After saving, restart <code className="rounded bg-muted px-1">npm run dev</code>{" "}
            so Next.js reloads environment variables, then sign in with Google.
          </p>
        )}
        <div className="mt-8">
          <SetupWizardClient isVercel={isVercel} deploymentUrl={deploymentUrl} />
        </div>
      </div>
    </div>
  );
}
