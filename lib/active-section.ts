import { createContext, useContext } from "react";

export type ActiveSection = "dashboard" | "email" | "calendar" | "tasks" | "notes";

export const ActiveSectionContext = createContext<{
  active: ActiveSection;
  setActive: (section: ActiveSection) => void;
} | null>(null);

export function useActiveSection() {
  const ctx = useContext(ActiveSectionContext);
  if (!ctx) {
    throw new Error("useActiveSection must be used within ActiveSectionContext provider");
  }
  return ctx;
}

