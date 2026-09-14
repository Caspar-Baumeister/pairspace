import { MascotFloat } from "@/components/mascot/Scenes";

export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6" role="status" aria-live="polite">
      <div className="pop w-full max-w-[260px] text-center">
        <MascotFloat className="w-full" label="Mo floats on the water while the page loads" />
        <p className="mt-2 text-[0.9375rem] font-extrabold text-ink-muted">One moment</p>
      </div>
    </div>
  );
}
