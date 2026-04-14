import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/DashboardShell";
import { DashboardWidgets } from "@/components/DashboardWidgets";
import {
  CalendarWidget,
  EmailWidget,
  MorningBriefingWidget,
  NotesWidget,
  TaskWidget,
} from "@/components/widgets";
import { auth } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { readSettingsFromCookies } from "@/lib/settings";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  const settings = readSettingsFromCookies();

  return (
    <DashboardShell
      userName={session.user?.name ?? undefined}
      userEmail={session.user?.email ?? undefined}
      userImage={session.user?.image}
      demoMode={getConfig().demoMode}
    >
      <DashboardWidgets>
        <MorningBriefingWidget aiMode={settings.aiMode} />
        <EmailWidget />
        <CalendarWidget />
        <TaskWidget />
        <NotesWidget />
      </DashboardWidgets>
    </DashboardShell>
  );
}
