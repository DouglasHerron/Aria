"use client";

import {
  Calendar,
  CheckSquare,
  FileText,
  Home,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { sectionToId } from "@/components/ActiveSectionProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveSection, type ActiveSection } from "@/lib/active-section";

const items = [
  { label: "Dashboard", icon: Home, section: "dashboard" },
  { label: "Email", icon: Mail, section: "email" },
  { label: "Calendar", icon: Calendar, section: "calendar" },
  { label: "Tasks", icon: CheckSquare, section: "tasks" },
  { label: "Notes", icon: FileText, section: "notes" },
] as const;

export function Sidebar() {
  const { active, setActive } = useActiveSection();

  function onSelect(section: ActiveSection) {
    setActive(section);
    const el = document.getElementById(sectionToId[section]);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-background py-3">
        {items.map(({ label, icon: Icon, section }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={
                  active === section
                    ? "h-10 w-10 shrink-0 bg-accent text-foreground"
                    : "h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
                }
                aria-label={label}
                onClick={() => onSelect(section)}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
      </aside>
    </TooltipProvider>
  );
}
