"use client";

import dynamic from "next/dynamic";
import type { MascotExpression } from "@/lib/constants";
import { MascotPlaceholder } from "./mascot-placeholder";

const MascotScene = dynamic(() => import("./mascot-scene"), {
  ssr: false,
  loading: () => <MascotPlaceholder />,
});

export function Mascot({
  expression = "curious",
  className,
}: {
  expression?: MascotExpression;
  className?: string;
}) {
  return <MascotScene expression={expression} className={className} />;
}
