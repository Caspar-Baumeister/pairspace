import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { castAvatar } from "@/lib/avatar";

/**
 * Realistic interface previews. These are static renderings of the real product
 * surfaces, built with the same tokens as the app so the page never shows a
 * screenshot that drifts away from the product.
 */

function Frame({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
        <span className="h-4 w-4 rounded-[5px] bg-accent" aria-hidden="true" />
        <span className="text-[0.875rem] font-semibold tracking-[-0.01em] text-ink">{title}</span>
        <span className="badge ml-auto bg-positive-soft text-positive">Live</span>
      </div>
      <div className="p-5">{children}</div>
      {footer ? <div className="border-t border-line bg-sunken px-5 py-3">{footer}</div> : null}
    </div>
  );
}

function FieldRow({
  label,
  value,
  hint,
}: {
  label: string;
  value?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-3">
      <span className="text-[0.875rem] text-ink-secondary">{label}</span>
      <span className="text-[0.8125rem] text-ink-faint">{value ?? hint}</span>
    </div>
  );
}

export function MockEventSetup() {
  return (
    <Frame title="Acro Weekend Berlin">
      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Participant categories
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="chip" data-active="true">
          Base
        </span>
        <span className="chip">Flyer</span>
        <span className="chip">Both</span>
        <span className="chip w-9 justify-center px-0 text-ink-faint">+</span>
      </div>

      <p className="mt-6 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Ask participants about
      </p>
      <div className="mt-3 space-y-2">
        <FieldRow label="Experience level" value="Required" />
        <FieldRow label="Availability" value="Optional" />
        <FieldRow label="Height" value="Optional" />
      </div>
    </Frame>
  );
}

export function MockShareLink() {
  return (
    <Frame
      title="Your event link"
      footer={
        <p className="text-[0.8125rem] text-ink-muted">
          Works in any browser. Nobody needs an account to open it.
        </p>
      }
    >
      <div className="flex items-center gap-2 rounded-xl border border-line bg-sunken px-3.5 py-3">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M6.5 9.5a3 3 0 0 0 4.24 0l2-2a3 3 0 1 0-4.24-4.24l-.7.7M9.5 6.5a3 3 0 0 0-4.24 0l-2 2a3 3 0 1 0 4.24 4.24l.7-.7"
            stroke="var(--color-ink-faint)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <span className="min-w-0 truncate text-[0.875rem] text-ink">pairspace.app/e/acro-weekend-berlin</span>
        <span className="badge ml-auto shrink-0 bg-accent-soft text-accent">Copy</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {["WhatsApp", "Email", "QR code"].map((c) => (
          <div
            key={c}
            className="rounded-xl border border-line px-3 py-2.5 text-center text-[0.8125rem] text-ink-secondary"
          >
            {c}
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function MockParticipantList() {
  const rows = [
    { name: "Leo", seed: "leo-fischer", role: "Base", meta: "Intermediate, Sat and Sun", score: "Strong match", tone: "positive" },
    { name: "Sara", seed: "sara-lindqvist", role: "Flyer", meta: "Improver, full weekend", score: "Possible match", tone: "accent" },
    { name: "Luca", seed: "luca-moretti", role: "Base", meta: "Advanced, Sunday", score: "Possible match", tone: "accent" },
  ] as const;

  return (
    <Frame
      title="Participants looking for a partner"
      footer={
        <p className="text-[0.8125rem] text-ink-muted">
          Contact details stay hidden until both sides agree.
        </p>
      }
    >
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3"
          >
            <PersonAvatar name={r.name} src={castAvatar(r.seed)} size={36} />
            <div className="min-w-0">
              <p className="text-[0.875rem] font-medium text-ink">
                {r.name}
                <span className="ml-1.5 text-[0.8125rem] font-normal text-ink-faint">{r.role}</span>
              </p>
              <p className="truncate text-[0.8125rem] text-ink-muted">{r.meta}</p>
            </div>
            <span
              className={`badge ml-auto shrink-0 ${
                r.tone === "positive" ? "bg-positive-soft text-positive" : "bg-accent-soft text-accent"
              }`}
            >
              {r.score}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <span className="btn btn-primary btn-sm flex-1">Connect</span>
        <span className="btn btn-secondary btn-sm flex-1">Notify me instead</span>
      </div>
    </Frame>
  );
}
