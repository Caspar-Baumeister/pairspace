export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "danger" | "positive";
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: { bg: "var(--color-blue-soft)", fg: "var(--color-blue)", border: "var(--color-blue-line)" },
    warning: { bg: "var(--color-warning-soft)", fg: "var(--color-warning)", border: "#F1DCBB" },
    danger: { bg: "var(--color-danger-soft)", fg: "var(--color-danger)", border: "#F5C9C4" },
    positive: { bg: "var(--color-positive-soft)", fg: "var(--color-positive)", border: "#BFE3CD" },
  }[tone];

  return (
    <div
      className="rounded-xl border px-4 py-3.5"
      style={{ background: tones.bg, borderColor: tones.border }}
      role="status"
    >
      {title ? (
        <p className="text-[0.875rem] font-semibold" style={{ color: tones.fg }}>
          {title}
        </p>
      ) : null}
      <div className="text-[0.875rem] leading-relaxed" style={{ color: "var(--color-ink-secondary)" }}>
        {children}
      </div>
    </div>
  );
}
