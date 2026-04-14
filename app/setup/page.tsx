import type { Metadata } from "next";

import { SetupWizardClient } from "@/components/SetupWizardClient";

export const metadata: Metadata = {
  title: "ARIA — Local setup",
  description: "Configure ARIA environment variables for local development",
};

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">ARIA local setup</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Values are saved to <code className="rounded bg-muted px-1">.env.local</code> in this
          project. After saving, restart <code className="rounded bg-muted px-1">npm run dev</code>{" "}
          so Next.js reloads environment variables, then sign in with Google.
        </p>
        <div className="mt-8">
          <SetupWizardClient />
        </div>
      </div>
    </div>
  );
}
