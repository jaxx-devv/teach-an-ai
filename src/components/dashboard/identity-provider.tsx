"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentIdentity, type Identity } from "@/lib/profile";

interface IdentityContextValue {
  identity: Identity | null;
  loading: boolean;
  refresh: () => void;
  setIdentity: (identity: Identity | null) => void;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setIdentity(getCurrentIdentity());
  };

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  return (
    <IdentityContext.Provider value={{ identity, loading, refresh, setIdentity }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used inside IdentityProvider");
  return ctx;
}
