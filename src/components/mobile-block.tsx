import { LogoMark } from "./logo-mark";

export function MobileBlock() {
  return (
    <div className="md:hidden fixed inset-0 z-[999] bg-[#0D0B1C] text-bone flex flex-col items-center justify-center px-8 text-center">
      <LogoMark size={40} />
      <h1 className="text-xl font-extrabold mt-5">Best on a bigger screen</h1>
      <p className="text-sm text-bone/60 mt-2 max-w-xs">
        Teach an AI is not yet optimized for mobile. Please open this on a
        desktop or tablet for the full experience.
      </p>
    </div>
  );
}
