"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mascot } from "@/components/mascot/mascot";
import { getLesson, type LessonDef } from "@/lib/lesson-catalog";
import {
  logMessage,
  completeLesson,
  saveCustomTopicTitle,
  setCurrentLesson,
} from "@/lib/profile";
import { useIdentity } from "@/components/dashboard/identity-provider";

type Stage = "intro" | "teaching" | "celebration";
type TeachMode = "explain" | "example" | "ask";
type Signal = "idle" | "thinking" | "happy" | "confused";

function buildCustomLesson(id: string, title: string, icon: string | null): LessonDef {
  const validIcons = ["dice", "loop", "branch", "var", "func", "recursion"] as const;
  const resolvedIcon = (validIcons as readonly string[]).includes(icon ?? "")
    ? (icon as LessonDef["icon"])
    : "dice";
  return {
    id,
    title,
    description: "A concept you are teaching from scratch.",
    category: "General Knowledge",
    icon: resolvedIcon,
    xpReward: 30,
    estimatedMinutes: 4,
    openingMisconception: `I have not learned about ${title.toLowerCase()} yet. I do not know where to start.`,
    keyPoints: title.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
    followUpQuestions: [
      "Can you explain that a different way?",
      "What is the most important part of that?",
      "How would you use that in practice?",
      "What made you bring that up first?",
      "Is there a simple example of that?",
      "What happens if that part is missing?",
      "How is that different from what I said before?",
      "What should I remember most about that?",
    ],
  };
}

const MODES: { id: TeachMode; label: string; hint: string }[] = [
  { id: "explain", label: "Explain", hint: "Teach with words" },
  { id: "example", label: "Show Example", hint: "Teach with an example" },
  { id: "ask", label: "Ask Me", hint: "Test my understanding" },
];

async function fetchWithTimeout(url: string, options: RequestInit, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default function TeachSessionPage() {
  const params = useParams<{ lessonId: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const { identity, loading: identityLoading, setIdentity } = useIdentity();
  const identityLoaded = !identityLoading;
  const [stage, setStage] = useState<Stage>("intro");
  const [mode, setMode] = useState<TeachMode>("explain");
  const [mascotLine, setMascotLine] = useState("");
  const [input, setInput] = useState("");
  const [turnIndex, setTurnIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [signal, setSignal] = useState<Signal>("idle");
  const [history, setHistory] = useState<{ role: "user" | "mascot"; content: string }[]>([]);

  const lesson = useMemo(() => {
    const catalogMatch = getLesson(params.lessonId);
    if (catalogMatch) return catalogMatch;

    const freshTitle = search.get("custom");
    if (freshTitle) return buildCustomLesson(params.lessonId, freshTitle, search.get("icon"));

    const savedTitle = identity?.customTopics?.[params.lessonId];
    if (savedTitle) return buildCustomLesson(params.lessonId, savedTitle, null);

    return null;
  }, [params.lessonId, search, identity]);

  useEffect(() => {
    if (lesson) setMascotLine(lesson.openingMisconception);
  }, [lesson]);

  useEffect(() => {
    const isFreshCustom = search.get("custom");
    if (identity && lesson) {
      const withTitle = isFreshCustom ? saveCustomTopicTitle(identity, lesson.id, lesson.title) : identity;
      setIdentity(setCurrentLesson(withTitle, lesson.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity?.id, lesson?.id]);

  if (identityLoaded && !lesson) {
    return (
      <div className="max-w-lg">
        <p className="text-bone/50">That topic does not exist yet.</p>
        <button
          onClick={() => router.push("/dashboard/teach")}
          className="mt-4 rounded-xl bg-lavender-deep text-white font-semibold px-5 py-2.5"
        >
          Back to Teach
        </button>
      </div>
    );
  }

  if (!lesson) {
    return <div className="text-bone/50 text-sm">Loading...</div>;
  }

  const beginTeaching = () => {
    if (identity) {
      setIdentity(
        logMessage(identity, {
          lessonId: lesson.id,
          role: "mascot",
          content: lesson.openingMisconception,
        })
      );
    }
    setHistory([{ role: "mascot", content: lesson.openingMisconception }]);
    setStage("teaching");
  };

  const submitExplanation = async () => {
    if (!input.trim() || !identity) return;
    setSubmitting(true);
    setSignal("thinking");

    const modePrefix =
      mode === "example" ? "Here's an example: " : mode === "ask" ? "Quick check: " : "";
    const content = `${modePrefix}${input.trim()}`;

    let current = logMessage(identity, { lessonId: lesson.id, role: "user", content });

    let understood = false;
    let mascotReply: string | null = null;

    try {
      const res = await fetchWithTimeout(
        "/api/teach/evaluate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lesson.title,
            openingMisconception: lesson.openingMisconception,
            keyPoints: lesson.keyPoints,
            followUpQuestions: lesson.followUpQuestions,
            explanation: content,
            turnIndex,
            history,
          }),
        },
        15000
      );
      if (res.ok) {
        const data = await res.json();
        understood = Boolean(data.understood);
        if (data.source !== "model") {
          console.warn(
            `[Teach an AI] Not using the real model (source: ${data.source}).`,
            data.debugReason ? `Reason: ${data.debugReason}` : "Check server logs for details."
          );
        }
        mascotReply = typeof data.mascotReply === "string" ? data.mascotReply : null;
      }
    } catch {
    }

    if (!mascotReply) {
      mascotReply = lesson.followUpQuestions[turnIndex % lesson.followUpQuestions.length];
    }

    current = logMessage(current, { lessonId: lesson.id, role: "mascot", content: mascotReply });

    setHistory((h) => [...h, { role: "user", content }, { role: "mascot", content: mascotReply as string }]);
    setMascotLine(mascotReply);
    setInput("");

    if (understood) {
      setSignal("happy");
      await new Promise((resolve) => setTimeout(resolve, 1600));
      setIdentity(completeLesson(current, lesson.id, lesson.xpReward));
      setXpAwarded(lesson.xpReward);
      setSubmitting(false);
      setStage("celebration");
    } else {
      setIdentity(current);
      setSubmitting(false);
      setSignal("confused");
      setTurnIndex((t) => t + 1);
    }
  };

  const markUnderstood = async () => {
    if (!identity) return;
    setSubmitting(true);
    const closingLine = "I think I actually get it now. Thank you for teaching me.";
    const current = logMessage(identity, { lessonId: lesson.id, role: "mascot", content: closingLine });
    setMascotLine(closingLine);
    setSignal("happy");
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIdentity(completeLesson(current, lesson.id, lesson.xpReward));
    setXpAwarded(lesson.xpReward);
    setSubmitting(false);
    setStage("celebration");
  };

  const mascotExpression =
    stage === "celebration"
      ? "excited"
      : signal === "thinking"
      ? "thinking"
      : signal === "confused"
      ? "confused"
      : signal === "happy"
      ? "proud"
      : "curious";

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/dashboard/teach")}
        className="text-sm text-bone/50 hover:text-bone mb-6"
      >
        &larr; Back to Teach
      </button>

      <div className="rounded-3xl bg-surface-dark-2 shadow-card p-8 mt-6">
        {stage === "intro" && (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-40 sm:w-44 sm:h-44 shrink-0">
              <Mascot expression={mascotExpression} className="w-full h-full" />
            </div>
            <div className="relative bg-white/[0.05] rounded-2xl rounded-tl-none sm:rounded-tl-2xl sm:rounded-l-none px-6 py-5">
              <p className="text-lg font-medium">&ldquo;{lesson.openingMisconception}&rdquo;</p>
            </div>
          </div>
        )}

        {stage !== "intro" && (
          <div className="flex justify-center mb-6 relative">
            <div className="relative w-32 h-32">
              <Mascot expression={mascotExpression} className="w-full h-full" />
              {stage === "celebration" && <CelebrationBurst />}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {stage === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-center mt-8"
            >
              <p className="font-bold">What will we do?</p>
              <p className="text-sm text-bone/60 mt-1">Choose how you want to teach me.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-left">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`rounded-2xl px-4 py-3.5 border transition-colors ${
                      mode === m.id
                        ? "border-lavender bg-lavender/10"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <p className="font-semibold text-sm">{m.label}</p>
                    <p className="text-xs text-bone/55 mt-0.5">{m.hint}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={beginTeaching}
                className="mt-8 rounded-xl bg-lavender-deep text-white font-semibold px-6 py-3"
              >
                Start Teaching
              </button>
            </motion.div>
          )}

          {stage === "teaching" && (
            <motion.div
              key="teaching"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-center">
                {mascotLine}
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "example"
                    ? "Give me a concrete example..."
                    : mode === "ask"
                    ? "Ask me a question to check my understanding..."
                    : "Explain it in your own words..."
                }
                rows={4}
                className="mt-4 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 outline-none focus:border-lavender resize-none"
              />
              <button
                onClick={submitExplanation}
                disabled={!input.trim() || submitting}
                className="mt-3 w-full rounded-xl bg-lavender-deep text-white font-semibold py-3 disabled:opacity-40"
              >
                {submitting ? "Thinking..." : "Teach"}
              </button>
              <button
                onClick={markUnderstood}
                disabled={submitting}
                className="mt-2 w-full rounded-xl border border-white/15 text-bone/70 font-medium py-2.5 text-sm disabled:opacity-40 hover:bg-white/[0.04]"
              >
                Mark as Understood
              </button>
            </motion.div>
          )}

          {stage === "celebration" && (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <p className="text-2xl font-extrabold text-lavender">It clicked.</p>
              <p className="text-bone/70 mt-2">{mascotLine}</p>
              <p className="mt-4 font-semibold text-teal">+{xpAwarded} XP</p>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => router.push("/dashboard/teach")}
                  className="rounded-xl border border-white/15 px-5 py-2.5 font-medium"
                >
                  Teach another topic
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="rounded-xl bg-lavender-deep text-white px-5 py-2.5 font-semibold"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const PARTICLE_COLORS = ["#A78BFA", "#14B8A6", "#FBBF24", "#38BDF8"];

function CelebrationBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const distance = 70 + Math.random() * 40;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
          delay: Math.random() * 0.15,
        };
      }),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 1 }}
          transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: p.color }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0.6, scale: 0.3 }}
        animate={{ opacity: 0, scale: 2.2 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="absolute w-24 h-24 rounded-full border-2 border-lavender"
      />
    </div>
  );
}
