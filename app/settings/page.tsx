import Link from "next/link";
import { redirect } from "next/navigation";

import { SettingsClient } from "@/components/SettingsClient";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { readSettingsFromCookies } from "@/lib/settings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  const settings = readSettingsFromCookies();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as{" "}
          <span className="text-foreground">
            {session.user?.email ?? session.user?.name ?? "user"}
          </span>
          .
        </p>

        <SettingsClient initial={settings} />
      </div>
    </main>
  );
}
