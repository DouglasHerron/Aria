import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config — used only by middleware.
 *
 * Providers are intentionally omitted: middleware only needs to verify
 * the existing JWT session (reads NEXTAUTH_SECRET), not initiate OAuth.
 * Keeping providers out avoids pulling in Node.js-only modules (jose's
 * DecompressionStream) into the Edge Runtime.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [],
};
