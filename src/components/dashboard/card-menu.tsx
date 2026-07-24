"use client";

import { useEffect, useRef, useState } from "react";

export function CardMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-bone/50 hover:text-bone hover:bg-white/[0.06] transition-colors"
        aria-label="Chat options"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 w-36 rounded-xl bg-surface-dark-2 border border-white/10 shadow-2xl overflow-hidden">
          <button
            onClick={() => {
              setOpen(false);
              onRename();
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/[0.06]"
          >
            Rename
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.06]"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
