"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LESSON_CATALOG } from "@/lib/lesson-catalog";
import {
  getRecentConversations,
  saveCustomTopicTitle,
  renameTopic,
  deleteConversation,
  type Identity,
  type ConversationSummary,
} from "@/lib/profile";
import { useIdentity } from "@/components/dashboard/identity-provider";
import { CardMenu } from "@/components/dashboard/card-menu";
import { RenameDeleteModal } from "@/components/dashboard/rename-delete-modal";

function resolveTitle(identity: Identity | null, lessonId: string) {
  const catalogMatch = LESSON_CATALOG.find((l) => l.id === lessonId);
  if (catalogMatch) return catalogMatch.title;
  return identity?.customTopics?.[lessonId] ?? lessonId;
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

export default function TeachHomePage() {
  const router = useRouter();
  const { identity, loading: identityLoading, setIdentity } = useIdentity();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [customTopic, setCustomTopic] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ mode: "rename" | "delete"; lessonId: string; title: string } | null>(null);

  useEffect(() => {
    if (!identity) return;
    setConversations(getRecentConversations(identity, 200));
    setConvLoading(false);
  }, [identity]);

  const loading = identityLoading || (identity !== null && convLoading);

  const confirmRename = (newTitle: string) => {
    if (!identity || !menuTarget) return;
    const updated = renameTopic(identity, menuTarget.lessonId, newTitle);
    setIdentity(updated);
    setConversations(getRecentConversations(updated, 200));
    setMenuTarget(null);
  };

  const confirmDelete = () => {
    if (!identity || !menuTarget) return;
    const updated = deleteConversation(identity, menuTarget.lessonId);
    setIdentity(updated);
    setConversations(getRecentConversations(updated, 200));
    setMenuTarget(null);
  };

  const startCustom = async () => {
    if (!customTopic.trim() || resolving || !identity) return;
    setResolving(true);
    setCustomError(null);
    try {
      const res = await fetch("/api/teach/topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: customTopic.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setCustomError(data.reason ?? "That topic is not allowed here.");
        setResolving(false);
        return;
      }
      const slug = `custom-${data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40)}`;

      setIdentity(saveCustomTopicTitle(identity, slug, data.title));

      router.push(
        `/dashboard/teach/${slug}?custom=${encodeURIComponent(data.title)}&icon=${data.icon}`
      );
    } catch {
      setCustomError("Could not check that topic. Try again.");
      setResolving(false);
    }
  };

  return (
    <>
    <div className="max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">
        What should we learn today?
      </h1>
      <p className="text-bone/70 mt-1">
        Type a topic and your AI student will meet you there.
      </p>

      <div className="mt-8 max-w-lg">
        <div className="flex gap-3">
          <input
            value={customTopic}
            onChange={(e) => {
              setCustomTopic(e.target.value);
              setCustomError(null);
            }}
            placeholder="Teach me about anything..."
            onKeyDown={(e) => e.key === "Enter" && startCustom()}
            className="flex-1 rounded-xl border border-bone/15 bg-surface-dark-2 px-4 py-3 outline-none focus:border-lavender"
          />
          <button
            onClick={startCustom}
            disabled={!customTopic.trim() || resolving}
            className="rounded-xl bg-lavender-deep text-white font-semibold px-5 disabled:opacity-40"
          >
            {resolving ? "Checking..." : "Teach"}
          </button>
        </div>
        {customError && (
          <p className="text-sm text-red-400 mt-2">{customError}</p>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold mb-3">All Chats</h2>

        {loading ? (
          <p className="text-sm text-bone/50">Loading...</p>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl bg-surface-dark-2 border border-bone/10 px-6 py-10 text-center text-sm text-bone/60">
            Nothing taught yet. Type a topic above to start your first lesson.
          </div>
        ) : (
          <div className="rounded-2xl bg-surface-dark-2 border border-bone/10 divide-y divide-bone/10 shadow-card">
            {conversations.map((c, i) => (
              <motion.div
                key={c.lessonId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03 }}
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
                  <p className="font-semibold text-sm">{resolveTitle(identity, c.lessonId)}</p>
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
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
