export const runtime = "edge";

export async function GET() {
  const vars = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    AUTH_URL: !!process.env.AUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  };

  const allPresent = Object.values(vars).some(Boolean);

  return Response.json({ runtime: "edge", vars, allPresent });
}
