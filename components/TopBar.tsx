"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogOut, Moon, Settings, Sun } from "lucide-react";
import { toast } from "sonner";

import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userInitials, cn } from "@/lib/utils";

interface TopBarProps {
  userName?: string;
  userEmail?: string;
  userImage?: string | null;
}

export function TopBar({ userName, userEmail, userImage }: TopBarProps) {
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const displayName = userName?.trim() || userEmail?.trim() || "Signed in";
  const initials = userInitials(userName, userEmail);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const html = document.documentElement;
    const next = !html.classList.contains("dark");
    html.classList.toggle("dark", next);
    setIsDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore
    }
    toast.message(next ? "Dark mode" : "Light mode");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <div className="flex min-w-0 flex-1 items-center">
        <span className="text-sm font-semibold tracking-tight">ARIA</span>
      </div>
      <div className="flex min-w-0 flex-[2] justify-center px-2">
        <time
          dateTime={new Date().toISOString().slice(0, 10)}
          className="truncate text-center text-xs text-muted-foreground sm:text-sm"
        >
          {dateLabel}
        </time>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full p-0"
              aria-label="Account menu"
            >
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- OAuth avatar URL
                <img
                  src={userImage}
                  alt=""
                  width={36}
                  height={36}
                  className={cn(
                    "h-9 w-9 rounded-full object-cover ring-1 ring-border",
                  )}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-1 ring-border"
                  aria-hidden
                >
                  {initials}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {userName ? (
                  <p className="text-sm font-medium leading-none">{userName}</p>
                ) : null}
                {userEmail ? (
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                ) : (
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayName}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => {
                void signOutAction();
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
