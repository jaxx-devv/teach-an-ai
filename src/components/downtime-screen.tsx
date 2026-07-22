import { LogoMark } from "@/components/logo-mark";

const REASONS: Record<string, string> = {
  mongodb: "The database connection isn't configured yet.",
  github_oauth: "GitHub OAuth credentials are missing or invalid.",
  ai_token: "The AI model token isn't configured yet.",
};

export function DowntimeScreen({ reason }: { reason?: string }) {
  return (
    <div className="dark min-h-screen flex items-center justify-center px-6 bg-canvas-dark text-bone">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-6 opacity-70">
          <LogoMark size={48} />
        </div>
        <h1 className="text-2xl font-extrabold">Teach an AI is currently down</h1>
        <p className="text-bone/60 mt-3">
          {reason && REASONS[reason] ? REASONS[reason] : "Something isn't configured correctly right now."}
        </p>
        <p className="text-sm text-bone/40 mt-6">
          If you're the developer: check your environment variables against
          .env.example.
        </p>
      </div>
    </div>
  );
}
