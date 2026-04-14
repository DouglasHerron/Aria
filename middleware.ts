import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

function coreEnvReady(): boolean {
  return !!(
    process.env.NEXTAUTH_SECRET?.trim() &&
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (pathname === "/setup" || pathname.startsWith("/api/setup")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/health") || pathname.startsWith("/api/ai/test")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    if (!coreEnvReady()) {
      return NextResponse.redirect(new URL("/setup", req.url));
    }
    return NextResponse.next();
  }

  if (!coreEnvReady()) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  if (!req.auth?.user) {
    const signIn = new URL("/api/auth/signin", req.url);
    signIn.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
