import type { AchievementDef } from "@/lib/achievements";

export function AchievementIcon({
  icon,
  className,
}: {
  icon: AchievementDef["icon"];
  className?: string;
}) {
  const props = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (icon) {
    case "spark":
      return (
        <svg {...props}>
          <path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3z" />
        </svg>
      );
    case "pencil":
      return (
        <svg {...props}>
          <path d="M4 20l1-4 11-11 3 3-11 11-4 1z" />
          <path d="M13 6l3 3" />
        </svg>
      );
    case "stack":
      return (
        <svg {...props}>
          <path d="M12 3l9 5-9 5-9-5 9-5z" />
          <path d="M3 13l9 5 9-5" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...props}>
          <path d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z" />
          <path d="M5 5H3v2a3 3 0 0 0 3 3M19 5h2v2a3 3 0 0 1-3 3M12 13v3m-3 4h6l-1-2h-4l-1 2Z" />
        </svg>
      );
    case "flame":
      return (
        <svg {...props}>
          <path d="M12 3c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-1-2-1-2 1 4-1 6-3 6a4 4 0 0 1-4-4c0-3 2-4 2-7Z" />
        </svg>
      );
  }
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
