"use client";

import { useEffect } from "react";
import { DowntimeScreen } from "@/components/downtime-screen";

export default function ErrorBoundary({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <DowntimeScreen />;
}
