"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  ActiveSectionContext,
  type ActiveSection,
} from "@/lib/active-section";

const sectionToId: Record<ActiveSection, string> = {
  dashboard: "aria-section-dashboard",
  email: "aria-section-email",
  calendar: "aria-section-calendar",
  tasks: "aria-section-tasks",
  notes: "aria-section-notes",
};

function pickActive(entries: IntersectionObserverEntry[]): ActiveSection | null {
  const visible = entries
    .filter((e) => e.isIntersecting)
    .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
  const top = visible[0];
  if (!top) return null;
  const id = (top.target as HTMLElement).id;
  const match = (Object.entries(sectionToId) as Array<[ActiveSection, string]>).find(
    ([, sectionId]) => sectionId === id,
  );
  return match?.[0] ?? null;
}

export function ActiveSectionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveSection>("dashboard");

  const value = useMemo(() => ({ active, setActive }), [active]);

  useEffect(() => {
    const ids = Object.values(sectionToId);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    let raf = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const next = pickActive(entries);
          if (next) setActive(next);
        });
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.05, 0.15, 0.25, 0.4, 0.6, 0.8],
      },
    );

    for (const el of elements) obs.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, []);

  return (
    <ActiveSectionContext.Provider value={value}>
      {children}
    </ActiveSectionContext.Provider>
  );
}

export { sectionToId };

