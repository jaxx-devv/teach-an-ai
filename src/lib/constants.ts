export const APP_NAME = "Teach an AI";
export const APP_TAGLINE = "Learn by teaching.";

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

export const REDUCED_MOTION_COOKIE = "taa_reduced_motion";

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
