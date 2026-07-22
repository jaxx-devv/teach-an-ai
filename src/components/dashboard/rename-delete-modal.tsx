"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface RenameDeleteModalProps {
  mode: "rename" | "delete";
  title: string;
  onCancel: () => void;
  onConfirmRename?: (newTitle: string) => void;
  onConfirmDelete?: () => void;
}

export function RenameDeleteModal({
  mode,
  title,
  onCancel,
  onConfirmRename,
  onConfirmDelete,
}: RenameDeleteModalProps) {
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-dark-2 text-bone rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10"
      >
        {mode === "rename" ? (
          <>
            <h2 className="text-lg font-bold">Rename chat</h2>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) onConfirmRename?.(draft.trim());
              }}
              className="mt-4 w-full rounded-xl border border-white/15 bg-transparent px-4 py-2.5 outline-none focus:border-lavender"
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl py-2.5 font-medium text-bone/60 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => draft.trim() && onConfirmRename?.(draft.trim())}
                disabled={!draft.trim()}
                className="flex-1 rounded-xl py-2.5 font-semibold bg-lavender-deep text-white disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold">Delete chat</h2>
            <p className="text-sm text-bone/60 mt-2">
              Delete &ldquo;{title}&rdquo;? This removes all messages and
              progress for this topic. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl py-2.5 font-medium text-bone/60 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmDelete}
                className="flex-1 rounded-xl py-2.5 font-semibold bg-red-500/90 hover:bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
