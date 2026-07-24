import { LogoMark } from "@/components/logo-mark";

export function DowntimeScreen() {
  return (
    <div className="dark min-h-screen flex items-center justify-center px-6 bg-canvas-dark text-bone">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-6 opacity-70">
          <LogoMark size={48} />
        </div>
        <h1 className="text-2xl font-extrabold">Teach an AI is currently down</h1>
        <p className="text-bone/60 mt-3">Something went wrong. Please try again shortly.</p>
      </div>
    </div>
  );
}
