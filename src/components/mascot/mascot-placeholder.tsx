export function MascotPlaceholder({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-lavender/15" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-lavender animate-spin" />
        </div>
      </div>
    </div>
  );
}
