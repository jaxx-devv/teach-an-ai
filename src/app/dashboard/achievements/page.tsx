"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getStats } from "@/lib/profile";
import { useIdentity } from "@/components/dashboard/identity-provider";
import { ACHIEVEMENT_CATALOG, evaluateAchievements } from "@/lib/achievements";
import { AchievementIcon, LockIcon } from "@/components/dashboard/achievement-icon";

export default function AchievementsPage() {
  const { identity } = useIdentity();
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identity) {
      setLoading(false);
      return;
    }
    const stats = getStats(identity);
    setUnlocked(
      evaluateAchievements({
        lessonsCompleted: identity.lessonsCompleted,
        confidences: stats.confidences,
        streak: stats.streak,
        totalUserMessages: stats.totalUserMessages,
      })
    );
    setLoading(false);
  }, [identity]);

  if (loading) {
    return <p className="text-sm text-bone/50">Loading achievements...</p>;
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Achievements</h1>
      <p className="text-bone/70 mt-1">
        Memories your AI student has earned along the way.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {ACHIEVEMENT_CATALOG.map((a, i) => {
          const isUnlocked = unlocked.has(a.id);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-2xl border p-5 shadow-card overflow-hidden ${
                isUnlocked
                  ? "bg-surface-dark-2 border-lavender/20"
                  : "bg-white/[0.02] border-dashed border-bone/10 opacity-50"
              }`}
            >
              {isUnlocked && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(167,139,250,0.12),transparent_60%)]" />
              )}
              <div className="relative flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isUnlocked ? "bg-amber/15 text-amber" : "bg-bone/5 text-bone/30"
                  }`}
                >
                  {isUnlocked ? <AchievementIcon icon={a.icon} /> : <LockIcon />}
                </div>
                <p className="font-bold">{a.title}</p>
              </div>
              <p className="relative text-sm text-bone/70 mt-3">{a.story}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
