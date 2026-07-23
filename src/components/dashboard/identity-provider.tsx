"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentIdentity, type Identity } from "@/lib/identity";

interface IdentityContextValue {
  identity: Identity | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setIdentity: (identity: Identity | null) => void;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const id = await getCurrentIdentity();
    setIdentity(id);
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
