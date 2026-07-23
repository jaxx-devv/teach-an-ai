import "server-only";

const DEFAULT_APP_URL = "https://teachanai.netlify.app";

export function getGitHubOAuthConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;

  return {
    clientId,
    callbackUrl:
      process.env.GITHUB_CALLBACK_URL ?? `${appUrl}/api/auth/callback`,
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userUrl: "https://api.github.com/user",
    scope: "read:user",
  };
}
