export const APP_NAME = "Teach an AI";
export const APP_TAGLINE = "Learn by teaching.";

const DEFAULT_APP_URL = "https://teachanai.netlify.app";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;

export const GITHUB = {
  clientId: process.env.GITHUB_CLIENT_ID ?? "Ov23li6L6Oucp3IIH98f",
  callbackUrl: process.env.GITHUB_CALLBACK_URL ?? `${APP_URL}/api/auth/callback`,
  authorizeUrl: "https://github.com/login/oauth/authorize",
  tokenUrl: "https://github.com/login/oauth/access_token",
  userUrl: "https://api.github.com/user",
  scope: "read:user",
};

export const GITHUB_MODELS = {
  endpoint:
    process.env.GITHUB_MODELS_ENDPOINT ??
    "https://models.inference.ai.azure.com",
  model: process.env.GITHUB_MODELS_MODEL ?? "azureml/Phi-4",
};

export const EXTERNAL_LINKS = {
  challenge: "https://prometheus-july-ai-challenge.devpost.com/",
  author: "https://github.com/wasteofwifi",
};

export const COLORS = {
  ink: "#0F172A",
  teal: "#14B8A6",
  amber: "#FBBF24",
  lavender: "#A78BFA",
  sky: "#38BDF8",
  bone: "#F5F5F4",
};

export const REDUCED_MOTION_KEY = "teach-an-ai-reduced-motion";
export const GUEST_DB_NAME = "teach-an-ai-guest";
export const GUEST_DB_VERSION = 1;

export const MASCOT_EXPRESSIONS = [
  "idle",
  "curious",
  "thinking",
  "confused",
  "excited",
  "proud",
  "focused",
  "sleepy",
  "sad",
  "surprised",
] as const;

export type MascotExpression = (typeof MASCOT_EXPRESSIONS)[number];
