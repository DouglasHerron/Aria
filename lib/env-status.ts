/**
 * Non-throwing env checks for /setup, middleware, and health before full config loads.
 * Do not import getConfig() from here (avoid circular deps).
 */

const CORE_DASHBOARD_KEYS = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

export type CoreDashboardKey = (typeof CORE_DASHBOARD_KEYS)[number];

export function getMissingCoreEnvKeys(): CoreDashboardKey[] {
  return CORE_DASHBOARD_KEYS.filter((key) => {
    const v = process.env[key];
    return v === undefined || v.trim() === "";
  });
}

export function isDashboardConfigReady(): boolean {
  return getMissingCoreEnvKeys().length === 0;
}
