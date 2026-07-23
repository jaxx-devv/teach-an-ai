import { NextResponse } from "next/server";
import { callModel } from "@/lib/model-client";

export async function GET() {
  const missingRequired: string[] = [];
  if (!process.env.MONGODB_URI) missingRequired.push("MONGODB_URI");
  if (!process.env.GITHUB_CLIENT_ID) missingRequired.push("GITHUB_CLIENT_ID");
  if (!process.env.GITHUB_CLIENT_SECRET) missingRequired.push("GITHUB_CLIENT_SECRET");
  if (!process.env.SESSION_SECRET) missingRequired.push("SESSION_SECRET");

  let aiModel: Record<string, unknown>;
  if (!process.env.GITHUB_MODELS_TOKEN) {
    aiModel = { configured: false, ok: false, detail: "GITHUB_MODELS_TOKEN not set" };
  } else {
    const result = await callModel(
      [{ role: "user", content: "Reply with the single word: ok" }],
      { label: "health-check", maxTokens: 5, timeoutMs: 4500 }
    );
    aiModel = {
      configured: true,
      ok: result.ok,
      usingEndpoint: result.endpoint,
      usingModel: result.model,
      detail: result.detail,
    };
  }

  return NextResponse.json({
    ok: true,
    guestModeAvailable: true,
    githubAuthAvailable: missingRequired.length === 0,
    missingRequired,
    aiModel,
  });
}
