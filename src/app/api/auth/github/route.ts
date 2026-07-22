import { NextRequest, NextResponse } from "next/server";
import { GITHUB } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;

  if (!process.env.GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/down?reason=github_oauth", origin));
  }

  const state = crypto.randomUUID();
  const url = new URL(GITHUB.authorizeUrl);
  url.searchParams.set("client_id", GITHUB.clientId);
  url.searchParams.set("redirect_uri", GITHUB.callbackUrl);
  url.searchParams.set("scope", GITHUB.scope);
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
