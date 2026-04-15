import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,

  // Adapter is conditional so the build succeeds when SUPABASE_URL is not
  // yet configured (e.g. local dev without Supabase, or Vercel before env
  // vars are added). Falls back to JWT-only sessions until vars are set.
  ...(process.env.SUPABASE_URL
    ? {
        adapter: SupabaseAdapter({
          url: process.env.SUPABASE_URL,
          secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        }),
      }
    : {}),

  // Must be explicit: adding an adapter changes NextAuth's default session
  // strategy from "jwt" to "database". We need JWT so that accessToken
  // flows through the cookie to the client for Gmail/Calendar API calls.
  session: { strategy: "jwt" },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.modify",
            "https://www.googleapis.com/auth/calendar",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
});
