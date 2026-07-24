"use client";

import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

export default function NotFound() {
  return (
    <div className="dark min-h-screen flex items-center justify-center px-6 bg-canvas-dark text-bone">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-6 opacity-70">
          <LogoMark size={48} />
        </div>
        <h1 className="text-2xl font-extrabold">Page not found</h1>
        <p className="text-bone/60 mt-3">
          Whatever you were looking for isn&apos;t here. Your AI student
          probably hasn&apos;t learned about this page either.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 rounded-xl bg-lavender-deep text-white font-semibold px-5 py-2.5"
        >
          Back to Teach an AI
        </Link>
      </div>
    </div>
  );
}
