"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getStatsFor } from "@/lib/identity";
import { useIdentity } from "./identity-provider";
import { ACHIEVEMENT_CATALOG, evaluateAchievements, type AchievementDef } from "@/lib/achievements";
import { AchievementIcon } from "./achievement-icon";

const SEEN_KEY = "teach-an-ai-seen-achievements";
const AUTO_DISMISS_MS = 4500;

export function AchievementToastWatcher() {
  const pathname = usePathname();
  const { identity } = useIdentity();
  const [queue, setQueue] = useState<AchievementDef[]>([]);

  useEffect(() => {
    if (!identity) return;
    (async () => {
      const stats = await getStatsFor(identity);
      const unlockedNow = evaluateAchievements({
        lessonsCompleted: identity.lessonsCompleted,
        confidences: stats.confidences,
        streak: stats.streak,
        totalUserMessages: stats.totalUserMessages,
      });

      const seen = new Set<string>(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"));
      const fresh = ACHIEVEMENT_CATALOG.filter((a) => unlockedNow.has(a.id) && !seen.has(a.id));
      if (fresh.length > 0) {
        setQueue((q) => [...q, ...fresh]);
      }
      localStorage.setItem(SEEN_KEY, JSON.stringify([...unlockedNow]));
    })();
  }, [pathname, identity]);

  const current = queue[0];

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      setQueue((q) => q.slice(1));
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [current]);

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 60, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="pointer-events-auto flex items-center gap-3 bg-surface-dark-2 border border-lavender/25 rounded-2xl shadow-2xl px-5 py-4 max-w-xs"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 14 }}
              className="w-11 h-11 shrink-0 rounded-full bg-amber/15 text-amber flex items-center justify-center"
            >
              <AchievementIcon icon={current.icon} />
            </motion.div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-lavender">
                Achievement Unlocked
              </p>
              <p className="text-sm font-bold">{current.title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
