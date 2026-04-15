/**
 * Non-throwing env checks for /setup, middleware, and health before full config loads.
 * Do not import getConfig() from here (avoid circular deps).
 */

// NEXTAUTH_URL is optional on Vercel — NextAuth v5 auto-detects from VERCEL_URL.
// Include it in the required list only when running outside of Vercel.
const ALWAYS_REQUIRED = [
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

const VERCEL_OPTIONAL = ["NEXTAUTH_URL"] as const;

export type CoreDashboardKey =
  | (typeof ALWAYS_REQUIRED)[number]
  | (typeof VERCEL_OPTIONAL)[number];

export function getMissingCoreEnvKeys(): CoreDashboardKey[] {
  const onVercel = !!process.env.VERCEL;
  const keys: CoreDashboardKey[] = [
    ...ALWAYS_REQUIRED,
    ...(onVercel ? [] : VERCEL_OPTIONAL),
  ];
  return keys.filter((key) => {
    const v = process.env[key];
    return v === undefined || v.trim() === "";
  });
}

export function isDashboardConfigReady(): boolean {
  return getMissingCoreEnvKeys().length === 0;
}
