import type { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return <LandingClient />;
}
