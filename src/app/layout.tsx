import type { Metadata } from "next";
import { MotionPreferenceProvider } from "@/components/motion-preference-provider";
import { MobileBlock } from "@/components/mobile-block";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME}, ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: "Learn by teaching an AI student that grows with every lesson.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <MobileBlock />
        <MotionPreferenceProvider>{children}</MotionPreferenceProvider>
      </body>
    </html>
  );
}
