import Image from "next/image";
import { clsx } from "clsx";

export function LogoMark({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Teach an AI"
      width={size}
      height={size}
      className={clsx("shrink-0 object-contain", className)}
      priority
    />
  );
}
