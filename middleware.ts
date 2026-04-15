import NextAuth from "next-auth";
import { type NextRequest, NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// The auth-wrapped handler — only invoked after coreEnvReady() passes.
// If called when NEXTAUTH_SECRET is missing, NextAuth throws and crashes
// the Edge Runtime, so we must never reach this branch without the guard.
const withAuth = auth((req) => {
  if (!req.auth?.user) {
    const signIn = new URL("/api/auth/signin", req.url);
    signIn.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
});

function coreEnvReady(): boolean {
  return !!(
    (process.env.NEXTAUTH_URL?.trim() || process.env.AUTH_URL?.trim()) &&
    (process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim()) &&
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets — skip immediately
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Setup, health, and debug routes are always public
  if (
    pathname === "/setup" ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/ai/test") ||
    pathname.startsWith("/api/debug")
  ) {
    return NextResponse.next();
  }

  // If required env vars aren't set, redirect everything to /setup.
  // This MUST run before auth() is invoked — calling auth() without
  // NEXTAUTH_SECRET crashes the Edge Runtime with MIDDLEWARE_INVOCATION_FAILED.
  if (!coreEnvReady()) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  // Auth callback routes — env is ready, let NextAuth handle them
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // All other routes — verify session via auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return withAuth(req as any, {} as any);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
