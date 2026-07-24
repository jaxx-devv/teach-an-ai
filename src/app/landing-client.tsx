"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogoMark } from "@/components/logo-mark";
import { Mascot } from "@/components/mascot/mascot";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { createProfile } from "@/lib/profile";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function LandingClient() {
  const router = useRouter();
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitProfile = () => {
    if (!displayName.trim()) return;
    setSubmitting(true);
    createProfile(displayName.trim());
    router.push("/dashboard");
  };

  return (
    <div className="dark min-h-screen w-full bg-[#0D0B1C] text-bone">
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="flex flex-col justify-between px-6 sm:px-10 lg:px-16 py-10 lg:py-14">
          <motion.div initial="hidden" animate="show" className="flex-1 flex flex-col justify-center items-center text-center max-w-sm mx-auto w-full">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3">
              <LogoMark size={36} />
              <span className="font-bold text-2xl tracking-tight">Teach an AI</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl font-extrabold tracking-tight leading-[1.05] mt-8"
            >
              Welcome
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mt-3 text-bone/80">
              Start teaching your AI student.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="mt-8 space-y-3 w-full">
              <button
                onClick={() => setNameModalOpen(true)}
                className="w-full rounded-2xl bg-lavender-deep text-white font-semibold py-3.5 transition-transform active:scale-[0.98] hover:opacity-90"
              >
                Start Teaching
              </button>
            </motion.div>
          </motion.div>

          <footer className="text-xs text-white text-center">
            Made for the{" "}
            <a
              href={EXTERNAL_LINKS.challenge}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-lavender"
            >
              Prometheus July AI Challenge
            </a>{" "}
            by{" "}
            <a
              href={EXTERNAL_LINKS.author}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-lavender"
            >
              taz
            </a>
          </footer>
        </div>

        <div className="hidden lg:block p-4">
          <div className="relative h-full rounded-[2rem] overflow-hidden border border-white/10 bg-[#161335]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(124,92,252,0.3),transparent_60%)]" />
            <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:44px_44px]" />
            <div className="absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_50%_35%,black,transparent_75%)] bg-[radial-gradient(1px_1px_at_20%_25%,white,transparent),radial-gradient(1px_1px_at_75%_20%,white,transparent),radial-gradient(1px_1px_at_35%_75%,white,transparent),radial-gradient(1.5px_1.5px_at_85%_65%,white,transparent),radial-gradient(1px_1px_at_12%_70%,white,transparent),radial-gradient(1px_1px_at_60%_85%,white,transparent),radial-gradient(1.5px_1.5px_at_90%_30%,white,transparent)]" />

            <Sparkle className="top-[12%] left-[14%]" delay={0} />
            <Sparkle className="top-[58%] left-[10%]" size={14} delay={0.6} />
            <Sparkle className="top-[10%] right-[14%]" size={12} delay={1.1} />
            <Ring className="top-[20%] right-[10%]" />
            <Dot className="bottom-[30%] right-[16%]" />

            <div className="relative z-10 h-full flex flex-col items-center justify-center px-12 py-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-52 h-52"
              >
                <Mascot expression="curious" className="w-full h-full" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="text-center mt-2 max-w-sm"
              >
                <h2 className="text-2xl font-extrabold text-lavender">
                  Every AI starts knowing nothing
                </h2>
                <p className="mt-2 text-bone/75">
                  You are its first and only teacher.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {nameModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#171533] text-bone rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-white/[0.06]"
          >
            <h2 className="text-xl font-bold">Choose your display name</h2>
            <p className="text-sm text-bone/75 mt-1">
              You can change this later in settings.
            </p>
            <input
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-5 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 outline-none focus:border-lavender"
              onKeyDown={(e) => e.key === "Enter" && submitProfile()}
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setNameModalOpen(false)}
                className="flex-1 rounded-xl py-2.5 font-medium text-bone/60 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={submitProfile}
                disabled={!displayName.trim() || submitting}
                className="flex-1 rounded-xl py-2.5 font-semibold bg-lavender-deep text-white disabled:opacity-40"
              >
                Begin
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function Sparkle({ className, size = 18, delay = 0 }: { className?: string; size?: number; delay?: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      className={`absolute z-10 text-lavender ${className}`}
      initial={{ opacity: 0.3, scale: 0.8 }}
      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.05, 0.8], y: [0, -6, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </motion.svg>
  );
}

function Ring({ className }: { className?: string }) {
  return (
    <motion.div
      className={`absolute z-10 w-6 h-6 rounded-full border-2 border-lavender/70 ${className}`}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function Dot({ className }: { className?: string }) {
  return (
    <motion.div
      className={`absolute z-10 w-2 h-2 rounded-full bg-lavender/60 ${className}`}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}


