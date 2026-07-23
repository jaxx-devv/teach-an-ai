"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { LogoMark } from "@/components/logo-mark";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/dashboard/teach", label: "Teach", icon: "book" },
  { href: "/dashboard/achievements", label: "Achievements", icon: "trophy" },
  { href: "/dashboard/progress", label: "Progress", icon: "chart" },
  { href: "/dashboard/settings", label: "Settings", icon: "gear" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 px-3 py-6 flex flex-col gap-8">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-1">
        <LogoMark size={28} />
        <span className="font-semibold text-lg tracking-tight">
          Teach an AI
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-lavender-deep dark:text-lavender"
                  : "text-ink/55 dark:text-bone/50 hover:bg-ink/[0.04] dark:hover:bg-bone/[0.06]"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl bg-lavender/15"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative flex items-center gap-3">
                <NavIcon name={item.icon} active={active} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const cls = clsx(
    "w-[18px] h-[18px]",
    active ? "text-lavender-deep dark:text-lavender" : "opacity-70"
  );
  const paths: Record<string, string> = {
    home: "M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9",
    book: "M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5C4.7 20 4 19.3 4 18.5v-13ZM20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5v-13Z",
    brain:
      "M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5.8 3 3 0 0 0 3 3.2h1V4Zm6 0a3 3 0 0 1 3 3v1a3 3 0 0 1 1 5.8 3 3 0 0 1-3 3.2h-1V4Z",
    bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z",
    trophy:
      "M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4ZM5 5H3v2a3 3 0 0 0 3 3M19 5h2v2a3 3 0 0 1-3 3M12 13v3m-3 4h6l-1-2H10l-1 2Z",
    chart: "M4 20V10m6 10V4m6 16v-7",
  };

  if (name === "gear") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d={paths[name]} />
    </svg>
  );
}
