"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getStats } from "@/lib/profile";
import { useIdentity } from "@/components/dashboard/identity-provider";
import { LESSON_CATALOG } from "@/lib/lesson-catalog";

export default function ProgressPage() {
  const { identity } = useIdentity();
  const [confidences, setConfidences] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!identity) return;
    const stats = getStats(identity);
    setConfidences(stats.confidences);
    setStreak(stats.streak);
  }, [identity]);

  const customEntries = Object.entries(identity?.customTopics ?? {});
  const attemptedIds = new Set(Object.keys(confidences));
  const topicRows = [
    ...LESSON_CATALOG.filter((l) => attemptedIds.has(l.id)).map((l) => ({ id: l.id, title: l.title })),
    ...customEntries
      .filter(([id]) => attemptedIds.has(id))
      .map(([id, title]) => ({ id, title })),
  ];

  const mastered = Object.values(confidences).filter((c) => c >= 100).length;
  const avgConfidence = topicRows.length
    ? Math.round(
        topicRows.reduce((sum, t) => sum + (confidences[t.id] ?? 0), 0) /
          topicRows.length
      )
    : 0;

  const stats = [
    { label: "Total XP", value: (identity?.xp ?? 0).toLocaleString() },
    { label: "Teaching Streak", value: `${streak} day${streak === 1 ? "" : "s"}` },
    { label: "Concepts Mastered", value: mastered },
    { label: "Average Confidence", value: `${avgConfidence}%` },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Progress</h1>
      <p className="text-bone/70 mt-1">
        How your AI student has grown over time.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-surface-dark-2 border border-bone/10 p-5 shadow-card"
          >
            <p className="text-xs text-bone/60">{s.label}</p>
            <p className="text-2xl font-extrabold mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-surface-dark-2 border border-bone/10 p-6 shadow-card">
        <h2 className="font-bold mb-4">Confidence by topic</h2>
        <div className="space-y-3">
          {topicRows.length === 0 ? (
            <p className="text-sm text-bone/40">Nothing taught yet.</p>
          ) : (
            topicRows.map((t) => {
              const c = confidences[t.id] ?? 0;
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{t.title}</span>
                    <span className="text-bone/45">{c}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-bone/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-teal rounded-full"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
