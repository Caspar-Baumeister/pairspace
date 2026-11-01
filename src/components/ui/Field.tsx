import type { ReactNode } from "react";

/** Label above a control, with an optional hint below. */
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-ui-small font-medium text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-ui-smaller text-faint">{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="toggle"
      onClick={() => onChange(!checked)}
    />
  );
}

/** Obsidian style setting row. */
export function Setting({
  name,
  description,
  children,
}: {
  name: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="setting">
      <div className="min-w-0 flex-1">
        <div className="setting-name">{name}</div>
        {description ? <div className="setting-desc">{description}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-ui-small text-red">{children}</p>;
}
