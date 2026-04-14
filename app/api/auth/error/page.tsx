"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, { title: string; body: string; action?: string | null }> = {
  AccessDenied: {
    title: "Access denied",
    body: "Your Google account hasn't been added to the ARIA test user list yet. Contact the project owner and share your Google account email address to get access.",
    action: "Once added, try signing in again.",
  },
  OAuthCallbackError: {
    title: "OAuth callback failed",
    body: "Google couldn't complete sign-in. This usually means the OAuth redirect URI for your deployment hasn't been registered yet.",
    action:
      "Contact the project owner with your deployment URL (visible in your browser address bar minus '/api/auth/error'). They need to add it to the Google OAuth client.",
  },
  OAuthSignin: {
    title: "Sign-in error",
    body: "Something went wrong starting the Google sign-in flow. This can happen if GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set correctly.",
    action: "Check your environment variables in the Vercel dashboard or your .env.local file.",
  },
  SessionRequired: {
    title: "Sign in required",
    body: "You need to sign in to access ARIA.",
    action: null,
  },
  Verification: {
    title: "Verification error",
    body: "The sign-in link may have expired or already been used.",
    action: "Please try signing in again.",
  },
  Configuration: {
    title: "Server configuration error",
    body: "ARIA is not fully configured yet. Required environment variables may be missing.",
    action: "Visit /setup to see which variables are missing.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") ?? "Unknown";
  const info = ERROR_MESSAGES[errorCode] ?? {
    title: "Sign-in error",
    body: `An unexpected error occurred (${errorCode}). Please try again or contact the project owner.`,
    action: null,
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{info.title}</h1>
          <p className="text-sm text-muted-foreground">
            Error code: <code className="rounded bg-muted px-1">{errorCode}</code>
          </p>
        </div>

        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-4 text-sm space-y-2">
          <p>{info.body}</p>
          {info.action && <p className="text-muted-foreground">{info.action}</p>}
        </div>

        <div className="flex gap-3">
          <a
            href="/api/auth/signin"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </a>
          {errorCode === "Configuration" && (
            <a
              href="/setup"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Go to setup
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
