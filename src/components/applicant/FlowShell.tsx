"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { FeedbackButton } from "@/components/feedback/Feedback";
import { LogoMark } from "@/components/ui/Logo";
import { useT } from "@/lib/i18n/client";
import type { Label } from "@/lib/options";

export const FLOW_STEPS: readonly Label[] = [
  { de: "Einschätzen", en: "Rate" },
  { de: "Zimmer", en: "Rooms" },
  { de: "Profil", en: "Profile" },
  { de: "Kontakt", en: "Contact" },
];

/** Sticky top bar with back button, title and the four step segments. */
export function FlowHeader({
  title,
  subtitle,
  onBack,
  step,
  steps = FLOW_STEPS.length,
  right,
  flatId,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Zero based index into FLOW_STEPS, omit to hide the progress bar. */
  step?: number;
  steps?: number;
  right?: ReactNode;
  /** Goes along with feedback, so it is clear which flat it is about. */
  flatId?: string;
}) {
  const t = useT();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 w-full max-w-[440px] items-center gap-2 px-3">
        {onBack ? (
          <button type="button" className="icon-btn" onClick={onBack} aria-label={t("Zurück", "Back")}>
            <ChevronLeft size={18} strokeWidth={1.75} />
          </button>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center text-ink">
            <LogoMark size={18} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-ui-small font-semibold text-ink">{title}</p>
          {subtitle ? <p className="truncate text-ui-smaller text-faint">{subtitle}</p> : null}
        </div>
        <FeedbackButton source="applicant" flatId={flatId} />
        {right}
      </div>
      {step !== undefined ? (
        <div className="mx-auto flex w-full max-w-[440px] gap-1 px-3 pb-2">
          {Array.from({ length: steps }, (_, i) => (
            <span
              key={i}
              className={`h-[3px] flex-1 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-base-30"}`}
            />
          ))}
        </div>
      ) : null}
    </header>
  );
}

export function Column({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[440px] px-4 ${className}`}>{children}</div>;
}

/** Bottom action bar that stays reachable while the content scrolls. */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 mt-6 border-t border-line bg-bg/92 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
      <div className="mx-auto w-full max-w-[440px] px-4">{children}</div>
    </div>
  );
}
