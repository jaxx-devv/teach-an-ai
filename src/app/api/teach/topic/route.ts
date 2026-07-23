import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/model-client";
import { checkCustomTopic } from "@/lib/content-filter";

const ICONS = ["dice", "loop", "branch", "var", "func", "recursion"] as const;

function heuristicIcon(topic: string): (typeof ICONS)[number] {
  const lower = topic.toLowerCase();
  if (/(loop|repeat|iterat)/.test(lower)) return "loop";
  if (/(if|condition|branch|decision)/.test(lower)) return "branch";
  if (/(variable|store|memory)/.test(lower)) return "var";
  if (/(function|method|return)/.test(lower)) return "func";
  if (/(recursi|self.?call)/.test(lower)) return "recursion";
  return "dice";
}

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function stripCodeFence(raw: string) {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function POST(req: NextRequest) {
  const { topic } = await req.json();

  if (typeof topic !== "string") {
    return NextResponse.json({ ok: false, reason: "Invalid request." }, { status: 400 });
  }

  const filtered = checkCustomTopic(topic);
  if (!filtered.ok) {
    return NextResponse.json({ ok: false, reason: filtered.reason }, { status: 200 });
  }

  if (!process.env.GITHUB_MODELS_TOKEN) {
    return NextResponse.json({
      ok: true,
      title: titleCase(topic.trim()),
      icon: heuristicIcon(topic),
      source: "heuristic",
    });
  }

  const result = await callModel(
    [
      {
        role: "system",
        content: `You clean up user-submitted learning topics for an education app. Given a raw topic string, respond as JSON only: {"title": string, "icon": one of ${JSON.stringify(ICONS)}, "appropriate": boolean}. "title" should be a short, clean, properly capitalized version of the topic (max 6 words). Set "appropriate" to false if the topic is sexual, violent, hateful, promotes self-harm, or is otherwise not suitable for a general-audience learning app.`,
      },
      { role: "user", content: topic },
    ],
    { label: "teach/topic", maxTokens: 100 }
  );

  if (result.ok && result.content) {
    try {
      const parsed = JSON.parse(stripCodeFence(result.content));
      if (parsed.appropriate === false) {
        return NextResponse.json({ ok: false, reason: "That topic is not allowed here." });
      }
      const icon = ICONS.includes(parsed.icon) ? parsed.icon : heuristicIcon(topic);
      return NextResponse.json({
        ok: true,
        title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : titleCase(topic.trim()),
        icon,
        source: "model",
      });
    } catch (err) {
      console.error("[teach/topic] Failed to parse model JSON:", result.content.slice(0, 300), err);
    }
  }

  return NextResponse.json({
    ok: true,
    title: titleCase(topic.trim()),
    icon: heuristicIcon(topic),
    source: "heuristic-fallback",
    debugReason: result.detail,
  });
}
