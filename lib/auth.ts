import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,

  // JWT sessions: accessToken flows through the cookie to the client
  // for Gmail/Calendar API calls. User + account rows are written to
  // Supabase manually in the jwt callback below — Auth.js v5 beta skips
  // adapter createUser/linkAccount when strategy is explicitly "jwt".
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
    async jwt({ token, account, user }) {
      if (account && user) {
        // Persist user + account to Supabase on first sign-in.
        // We do this here because Auth.js v5 beta does not reliably call
        // adapter.createUser / adapter.linkAccount when strategy is "jwt".
        const supabase = getSupabase();
        if (supabase) {
          await supabase.from("users").upsert(
            {
              id: user.id,
              name: user.name ?? null,
              email: user.email ?? null,
              image: user.image ?? null,
            },
            { onConflict: "id" }
          );
          await supabase.from("accounts").upsert(
            {
              "userId": user.id,
              type: account.type,
              provider: account.provider,
              "providerAccountId": account.providerAccountId,
              refresh_token: account.refresh_token ?? null,
              access_token: account.access_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
              session_state: (account.session_state as string) ?? null,
            },
            { onConflict: "provider,providerAccountId" }
          );
        }

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
