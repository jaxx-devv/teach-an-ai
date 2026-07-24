import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/model-client";
import { evaluateExplanation } from "@/lib/teaching-evaluator";

function stripCodeFence(raw: string) {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function POST(req: NextRequest) {
  const { title, openingMisconception, keyPoints, followUpQuestions, explanation, turnIndex, history } =
    await req.json();

  if (!title || !openingMisconception || typeof explanation !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const lessonLike = {
    title: String(title),
    openingMisconception: String(openingMisconception),
    keyPoints: Array.isArray(keyPoints) ? keyPoints : [],
    followUpQuestions: Array.isArray(followUpQuestions) && followUpQuestions.length
      ? followUpQuestions
      : ["Can you explain that a different way?", "What is the most important part of that?"],
  };

  const priorUserExplanations: string[] = Array.isArray(history)
    ? history.filter((h: { role: string }) => h?.role === "user").map((h: { content: string }) => String(h.content))
    : [];

  if (!process.env.GITHUB_MODELS_TOKEN) {
    const result = evaluateExplanation(lessonLike, explanation, turnIndex ?? 0, priorUserExplanations);
    return NextResponse.json({ ...result, source: "heuristic" });
  }

  const conversationMessages = Array.isArray(history)
    ? history
        .filter((h: { role: string; content: string }) => h && typeof h.content === "string")
        .map((h: { role: string; content: string }) => ({
          role: h.role === "mascot" ? "assistant" : "user",
          content: h.content,
        }))
    : [];

  const result = await callModel(
    [
      {
        role: "system",
        content: `You are a curious beginner AI student inside a learning app called Teach an AI. You are being taught about "${lessonLike.title}". You started with this misconception: "${lessonLike.openingMisconception}".

You are being taught over multiple turns, not one message. Judge understanding based on the ENTIRE conversation so far, not just the latest message.

Be a genuinely skeptical, slow learner:
- Do NOT mark understood:true just because the user mentioned one fact, used a correct term, or touched on a related idea. That is not the same as explaining the concept.
- Only mark understood:true once the user has, across the conversation, actually explained the core mechanism well enough that a real beginner would understand it: what it is, how it works, and why your original misconception was wrong.
- If they've only partially explained it, acknowledge what landed, then ask a specific follow-up that probes the part that's still missing or unclear. Do not repeat a question you've already effectively gotten an answer to.
- If this is early in the conversation (few exchanges so far), you should almost always still be at understood:false, even if the explanation sounds reasonable, unless it was unusually thorough.
- Never mark understood:true on the very first message of the conversation.

Respond in one or two short sentences, in character, never as an assistant and never mentioning that you are an AI model. Respond with JSON only, no markdown fences: {"understood": boolean, "mascotReply": string}.`,
      },
      ...conversationMessages,
      { role: "user", content: explanation },
    ],
    { label: "teach/evaluate", maxTokens: 220 }
  );

  if (result.ok && result.content) {
    try {
      const parsed = JSON.parse(stripCodeFence(result.content));
      if (typeof parsed.mascotReply === "string" && parsed.mascotReply.trim()) {
        return NextResponse.json({
          understood: Boolean(parsed.understood),
          mascotReply: parsed.mascotReply,
          source: "model",
        });
      }
      console.error("[teach/evaluate] Model response missing mascotReply:", result.content.slice(0, 300));
    } catch (err) {
      console.error("[teach/evaluate] Failed to parse model JSON:", result.content.slice(0, 300), err);
    }
  }

  const fallback = evaluateExplanation(lessonLike, explanation, turnIndex ?? 0, priorUserExplanations);
  return NextResponse.json({ ...fallback, source: "heuristic-fallback", debugReason: result.detail });
}
