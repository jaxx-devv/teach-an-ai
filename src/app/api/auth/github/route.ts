import { NextRequest, NextResponse } from "next/server";
import { getGitHubOAuthConfig } from "@/lib/github-oauth";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const github = getGitHubOAuthConfig();

  if (!github || !process.env.GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/down?reason=github_oauth", origin));
  }

  const state = crypto.randomUUID();
  const url = new URL(github.authorizeUrl);
  url.searchParams.set("client_id", github.clientId);
  url.searchParams.set("redirect_uri", github.callbackUrl);
  url.searchParams.set("scope", github.scope);
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
