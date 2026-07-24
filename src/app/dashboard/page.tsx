"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mascot } from "@/components/mascot/mascot";
import {
  getRecentConversations,
  renameTopic,
  deleteConversation,
  type Identity,
  type ConversationSummary,
} from "@/lib/profile";
import { useIdentity } from "@/components/dashboard/identity-provider";
import { CardMenu } from "@/components/dashboard/card-menu";
import { RenameDeleteModal } from "@/components/dashboard/rename-delete-modal";
import { LESSON_CATALOG } from "@/lib/lesson-catalog";

const cardIn = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.04 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  }),
};

function resolveTitle(identity: Identity | null, lessonId: string) {
  const catalogMatch = LESSON_CATALOG.find((l) => l.id === lessonId);
  if (catalogMatch) return catalogMatch.title;
  return identity?.customTopics?.[lessonId] ?? lessonId;
}

function deriveMood(conversations: ConversationSummary[]) {
  if (conversations.length === 0) return "Curious";
  const latest = conversations[0];
  if (latest.confidence === "High Confidence") return "Confident";
  if (latest.confidence === "Medium Confidence") return "Focused";
  return "Curious";
}

function deriveBreakthrough(conversations: ConversationSummary[]) {
  return conversations.find((c) => c.confidence === "High Confidence") ?? null;
}

function greeting(name: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}`;
}

function relativeTime(ts: number) {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { identity, loading: identityLoading, setIdentity } = useIdentity();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [convLoading, setConvLoading] = useState(true);

  useEffect(() => {
    if (!identity) return;
    setConversations(getRecentConversations(identity, 3));
    setConvLoading(false);
  }, [identity]);

  const loading = identityLoading || (identity !== null && convLoading);
  const [menuTarget, setMenuTarget] = useState<{ mode: "rename" | "delete"; lessonId: string; title: string } | null>(null);

  const confirmRename = (newTitle: string) => {
    if (!identity || !menuTarget) return;
    const updated = renameTopic(identity, menuTarget.lessonId, newTitle);
    setIdentity(updated);
    setConversations(getRecentConversations(updated, 3));
    setMenuTarget(null);
  };

  const confirmDelete = () => {
    if (!identity || !menuTarget) return;
    const updated = deleteConversation(identity, menuTarget.lessonId);
    setIdentity(updated);
    setConversations(getRecentConversations(updated, 3));
    setMenuTarget(null);
  };

  if (loading) {
    return <div className="text-bone/50 text-sm">Loading your student...</div>;
  }

  const displayName = identity?.displayName ?? "there";
  const xp = identity?.xp ?? 0;
  const progressPct = identity
    ? Math.round((identity.lessonsCompleted.length / LESSON_CATALOG.length) * 100)
    : 0;
  const mood = deriveMood(conversations);
  const breakthrough = deriveBreakthrough(conversations);

  const mostRecent = conversations[0] ?? null;
  const todayLessonId = mostRecent?.lessonId ?? null;
  const todayLessonTitle = todayLessonId ? resolveTitle(identity, todayLessonId) : null;

  return (
    <>
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      <div className="space-y-6 min-w-0">
        <motion.div variants={cardIn} initial="hidden" animate="show" custom={0} className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {greeting(displayName)}
            </h1>
            <p className="text-bone/70 mt-1">
              Your AI is excited to learn with you today.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-surface-dark-2 border border-bone/10 px-4 py-2 text-sm font-semibold shadow-card">
            <SparkleIcon />
            {xp.toLocaleString()} XP
          </div>
        </motion.div>

        {todayLessonId && todayLessonTitle ? (
          <motion.div
            variants={cardIn}
            initial="hidden"
            animate="show"
            custom={1}
            className="relative overflow-hidden rounded-3xl bg-surface-dark-2 p-8 flex items-start justify-between gap-8"
          >
            <div className="relative flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-wide text-lavender uppercase">
                Today&apos;s Lesson
              </p>
              <h2 className="text-3xl font-extrabold mt-2">{todayLessonTitle}</h2>
              <p className="text-bone/70 mt-2 max-w-md">
                {mostRecent?.lastMessage}
              </p>
              <button
                onClick={() => router.push(`/dashboard/teach/${todayLessonId}`)}
                className="mt-6 rounded-xl bg-lavender-deep text-white font-semibold px-5 py-3 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition"
              >
                Continue Teaching <ArrowIcon />
              </button>
            </div>

            <div className="relative w-56 shrink-0 rounded-2xl bg-white/[0.06] p-5 text-center hidden sm:block">
              <div className="w-12 h-12 mx-auto rounded-full bg-lavender-deep flex items-center justify-center">
                <ConstructionIcon />
              </div>
              <p className="font-bold mt-3">In Progress</p>
              <p className="text-sm text-bone/70 mt-1">
                Pick up right where you left off.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={cardIn}
            initial="hidden"
            animate="show"
            custom={1}
            className="relative overflow-hidden rounded-3xl bg-surface-dark-2 p-8 flex items-center justify-between gap-8"
          >
            <div className="relative">
              <p className="text-xs font-semibold tracking-wide text-lavender uppercase">
                Today&apos;s Lesson
              </p>
              <h2 className="text-2xl font-extrabold mt-2">No lesson selected yet</h2>
              <p className="text-bone/70 mt-2 max-w-md">
                Choose a topic to teach and your AI student will meet you there.
              </p>
              <button
                onClick={() => router.push("/dashboard/teach")}
                className="mt-6 rounded-xl bg-lavender-deep text-white font-semibold px-5 py-3 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition"
              >
                Start one <ArrowIcon />
              </button>
            </div>
          </motion.div>
        )}

        <motion.div variants={cardIn} initial="hidden" animate="show" custom={2}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">Recent Conversations</h3>
            <button
              onClick={() => router.push("/dashboard/teach")}
              className="text-sm font-medium text-bone/60 hover:text-bone"
            >
              View all
            </button>
          </div>
          <div className="rounded-2xl bg-surface-dark-2 border border-bone/10 divide-y divide-bone/10 shadow-card">
            {conversations.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-bone/60">
                No lessons taught yet. Start one above and it will show up here.
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.lessonId}
                  onClick={() => router.push(`/dashboard/teach/${c.lessonId}`)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors text-left cursor-pointer"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      c.confidence === "High Confidence"
                        ? "bg-teal"
                        : c.confidence === "Medium Confidence"
                        ? "bg-amber"
                        : "bg-sky"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {resolveTitle(identity, c.lessonId)}
                    </p>
                    <p className="text-sm text-bone/60 truncate">{c.lastMessage}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ${
                      c.confidence === "High Confidence"
                        ? "bg-teal/15 text-teal"
                        : c.confidence === "Medium Confidence"
                        ? "bg-amber/15 text-amber"
                        : "bg-sky/15 text-sky"
                    }`}
                  >
                    {c.confidence}
                  </span>
                  <span className="text-xs text-bone/50 w-16 text-right shrink-0">
                    {relativeTime(c.updatedAt)}
                  </span>
                  <CardMenu
                    onRename={() => setMenuTarget({ mode: "rename", lessonId: c.lessonId, title: resolveTitle(identity, c.lessonId) })}
                    onDelete={() => setMenuTarget({ mode: "delete", lessonId: c.lessonId, title: resolveTitle(identity, c.lessonId) })}
                  />
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <aside className="space-y-4 min-w-0">
        <motion.div variants={cardIn} initial="hidden" animate="show" custom={1} className="rounded-3xl bg-surface-dark-2 border border-bone/10 p-6 shadow-card">
          <h3 className="font-bold mb-3">Your AI Student</h3>
          <div className="rounded-2xl bg-canvas-dark h-52 relative overflow-hidden">
            <Mascot expression="curious" className="w-full h-full" />
          </div>
          <div className="rounded-xl bg-white/[0.04] px-4 py-3 mt-4 text-sm">
            <p className="font-medium">
              {conversations.length === 0
                ? "I do not know anything yet."
                : "I found something new."}
            </p>
            <p className="text-bone/60">
              {conversations.length === 0
                ? "Teach me something to get started."
                : "But I am not sure I get it yet."}
            </p>
          </div>
        </motion.div>

        <motion.div variants={cardIn} initial="hidden" animate="show" custom={2} className="rounded-3xl bg-surface-dark-2 border border-bone/10 p-6 shadow-card">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Confidence</span>
            <InfoIcon />
          </div>
          <div className="flex items-center justify-between text-sm mt-3">
            <span className="text-bone/70">Overall Progress</span>
            <span className="font-semibold">{progressPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-bone/10 mt-2 overflow-hidden">
            <div className="h-full bg-teal rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
        </motion.div>

        <motion.div variants={cardIn} initial="hidden" animate="show" custom={3} className="rounded-3xl bg-surface-dark-2 border border-bone/10 p-4 shadow-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-lavender/15 flex items-center justify-center">
            <MoodIcon mood={mood} />
          </div>
          <div>
            <p className="text-sm font-semibold flex items-center gap-1">
              Current Mood <InfoIcon />
            </p>
            <p className="text-sm text-lavender font-medium">{mood}</p>
          </div>
        </motion.div>

        <motion.div variants={cardIn} initial="hidden" animate="show" custom={4} className="rounded-3xl bg-surface-dark-2 border border-bone/10 p-6 shadow-card">
          <p className="text-sm font-bold flex items-center gap-1.5 text-teal">
            <SparkleIcon /> Recent Breakthrough
          </p>
          {breakthrough ? (
            <>
              <p className="text-sm text-bone/80 mt-2">
                You helped me understand {resolveTitle(identity, breakthrough.lessonId).toLowerCase()}.
              </p>
              <p className="text-xs text-bone/50 mt-2">{relativeTime(breakthrough.updatedAt)}</p>
            </>
          ) : (
            <p className="text-sm text-bone/70 mt-2">
              No breakthroughs yet. Teach me something until it clicks.
            </p>
          )}
        </motion.div>
      </aside>
    </div>

    <AnimatePresence>
      {menuTarget && (
        <RenameDeleteModal
          mode={menuTarget.mode}
          title={menuTarget.title}
          onCancel={() => setMenuTarget(null)}
          onConfirmRename={confirmRename}
          onConfirmDelete={confirmDelete}
        />
      )}
    </AnimatePresence>
    </>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-lavender">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function ConstructionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <circle cx="9.2" cy="10.4" r="1.15" fill="white" stroke="none" />
      <path d="M9.2 11.6v2.1l-1.3 3.2M9.2 13l1.9.5 1.6-1.8M11.1 13.5l1.1 3.4" />
      <path d="M13.5 11.5l2.3-1.1.9 1.6" />
    </svg>
  );
}

function MoodIcon({ mood }: { mood: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    className: "text-lavender",
  };
  if (mood === "Confident") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 10h.01M16 10h.01M7.5 14c1 1.5 2.7 2.4 4.5 2.4s3.5-.9 4.5-2.4" />
      </svg>
    );
  }
  if (mood === "Focused") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 10h.01M16 10h.01M8.5 15h7" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 10h.01M16 10h.01M8.5 14.5c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}
