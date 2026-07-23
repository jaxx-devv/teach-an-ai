"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { REDUCED_MOTION_KEY } from "@/lib/constants";

interface MotionPreferenceValue {
  reduced: boolean;
  setReduced: (value: boolean) => void;
}

const MotionPreferenceContext = createContext<MotionPreferenceValue | null>(null);

export function MotionPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReducedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReducedState(localStorage.getItem(REDUCED_MOTION_KEY) === "true");
    setHydrated(true);
  }, []);

  const setReduced = (value: boolean) => {
    setReducedState(value);
    localStorage.setItem(REDUCED_MOTION_KEY, String(value));
  };

  return (
    <MotionPreferenceContext.Provider value={{ reduced, setReduced }}>
      <MotionConfig reducedMotion={hydrated && reduced ? "always" : "never"}>
        {children}
      </MotionConfig>
    </MotionPreferenceContext.Provider>
  );
}

export function useMotionPreference() {
  const ctx = useContext(MotionPreferenceContext);
  if (!ctx) throw new Error("useMotionPreference must be used inside MotionPreferenceProvider");
  return ctx;
}
