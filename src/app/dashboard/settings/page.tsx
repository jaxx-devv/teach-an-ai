"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayName, exportData, resetMemory, clearProfile } from "@/lib/profile";
import { useIdentity } from "@/components/dashboard/identity-provider";
import { useMotionPreference } from "@/components/motion-preference-provider";

export default function SettingsPage() {
  const router = useRouter();
  const { identity, setIdentity } = useIdentity();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const { reduced: reducedMotion, setReduced: setReducedMotion } = useMotionPreference();
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    if (identity) setNameDraft(identity.displayName);
  }, [identity]);

  const saveName = () => {
    if (!identity || !nameDraft.trim()) return;
    setIdentity(updateDisplayName(identity, nameDraft.trim()));
    setEditingName(false);
  };

  const handleExport = () => {
    if (!identity) return;
    const json = exportData(identity);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teach-an-ai-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (!identity) return;
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    setIdentity(resetMemory(identity));
    setResetConfirm(false);
  };

  const handleSignOut = () => {
    clearProfile();
    router.push("/");
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>

      <section className="rounded-3xl bg-surface-dark-2 border border-bone/10 p-6 shadow-card">
        <h2 className="font-bold mb-4">Experience</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Reduced motion</p>
            <p className="text-sm text-bone/70">
              Turn off page transitions and card animations.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reducedMotion}
            onClick={() => setReducedMotion(!reducedMotion)}
            className="w-11 h-6 rounded-full relative shrink-0 transition-colors duration-200"
            style={{ backgroundColor: reducedMotion ? "#7C5CFC" : "rgba(245,245,244,0.15)" }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
              style={{ left: reducedMotion ? "22px" : "2px" }}
            />
          </button>
        </div>
      </section>

      {identity && (
        <section className="rounded-3xl bg-surface-dark-2 border border-bone/10 p-6 shadow-card">
          <h2 className="font-bold mb-4">Account</h2>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    autoFocus
                    className="flex-1 rounded-lg border border-bone/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-lavender"
                  />
                  <button onClick={saveName} className="text-sm font-semibold text-lavender">
                    Save
                  </button>
                </div>
              ) : (
                <p className="font-semibold flex items-center gap-2">{identity.displayName}</p>
              )}
              <p className="text-sm text-bone/70">Progress saved on this device only</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {!editingName && (
                <button
                  onClick={() => setEditingName(true)}
                  className="rounded-xl border border-bone/15 px-4 py-2 text-sm font-medium"
                >
                  Change Display Name
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="rounded-xl border border-bone/15 px-4 py-2 text-sm font-medium whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>
      )}

      {identity && (
        <section className="rounded-3xl bg-surface-dark-2 border border-bone/10 p-6 shadow-card">
          <h2 className="font-bold mb-4">Data</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Export knowledge</p>
              <p className="text-sm text-bone/70">
                Download everything you have taught as JSON.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="rounded-xl border border-bone/15 px-4 py-2 text-sm font-medium"
            >
              Export
            </button>
          </div>
        </section>
      )}

      {identity && (
        <section className="rounded-3xl border border-red-500/20 bg-red-500/[0.03] p-6">
          <h2 className="font-bold mb-1 text-red-500">Danger Zone</h2>
          <p className="text-sm text-bone/70 mb-4">
            Erase everything your AI has learned. XP, confidence and lesson
            history all reset to zero. This cannot be undone.
          </p>
          <button
            onClick={handleReset}
            className="rounded-xl border border-red-500/30 text-red-500 px-4 py-2 text-sm font-medium"
          >
            {resetConfirm ? "Click again to confirm" : "Reset AI Memory"}
          </button>
        </section>
      )}
    </div>
  );
}
