"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { ActiveSection } from "@/lib/active-section";
import { sectionToId } from "@/components/ActiveSectionProvider";

interface DashboardWidgetsProps {
  children: ReactNode;
}

function AnimatedItem({
  children,
  delayMs,
}: {
  children: ReactNode;
  delayMs: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delayMs / 1000 }}
    >
      {children}
    </motion.div>
  );
}

export function DashboardWidgets({ children }: DashboardWidgetsProps) {
  const items = Array.isArray(children) ? children : [children];
  const sections: ActiveSection[] = ["dashboard", "email", "calendar", "tasks", "notes"];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {items.map((child, idx) => (
        <section
          key={idx}
          id={sectionToId[sections[idx] ?? "dashboard"]}
          className={sections[idx] === "dashboard" ? "lg:col-span-2" : undefined}
        >
          <AnimatedItem delayMs={idx === 0 ? 0 : idx <= 2 ? 150 : 300}>
            {child}
          </AnimatedItem>
        </section>
      ))}
    </div>
  );
}

