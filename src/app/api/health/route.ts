import { NextResponse } from "next/server";
import { callModel } from "@/lib/model-client";

export async function GET() {
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

  return NextResponse.json({ ok: true, aiModel });
}
