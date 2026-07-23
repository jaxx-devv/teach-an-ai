import { NextRequest, NextResponse } from "next/server";
import { getGitHubOAuthConfig } from "@/lib/github-oauth";
import { createSession } from "@/lib/session";
import { upsertGitHubUser } from "@/lib/db";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("oauth_state")?.value;
  const github = getGitHubOAuthConfig();

  if (
    !github ||
    !process.env.GITHUB_CLIENT_SECRET ||
    !process.env.MONGODB_URI ||
    !process.env.SESSION_SECRET
  ) {
    return NextResponse.redirect(new URL("/down?reason=github_oauth", origin));
  }

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/?error=invalid_state", origin));
  }

  try {
    const tokenRes = await fetch(github.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: github.clientId,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: github.callbackUrl,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/?error=oauth_failed", origin));
    }

    const userRes = await fetch(github.userUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/?error=oauth_failed", origin));
    }
    const ghUser = await userRes.json();

    const user = await upsertGitHubUser({
      githubId: String(ghUser.id),
      username: ghUser.login,
      avatarUrl: ghUser.avatar_url,
      displayName: ghUser.name || ghUser.login,
    });

    const res = NextResponse.redirect(new URL("/dashboard", origin));
    await createSession(res, { userId: user.id, provider: "github" });
    res.cookies.delete("oauth_state");
    return res;
  } catch {
    return NextResponse.redirect(new URL("/down?reason=github_oauth", origin));
  }
}
