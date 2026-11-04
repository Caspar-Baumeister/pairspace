"use client";

import {
  declarationLines,
  formatDateTime,
  LIMITS,
  type CancelType,
  type CancelWhen,
  type ContractDeclaration,
  type ContractKind,
} from "@shared/contract";
import { CircleCheck, Printer } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { ErrorText, Field } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { useLocale, useLocalePath, useT } from "@/lib/i18n/client";
import { OPERATOR } from "@/lib/legal";

/**
 * The confirmation page behind "Verträge hier kündigen" (§ 312k BGB) and
 * "Vertrag widerrufen" (§ 356a BGB). Public, no sign in, and it asks only
 * for what the law allows: who, which contract, and for a cancellation its
 * kind and date. After sending, the declaration is shown with date and time
 * so it can be printed or saved, and a receipt goes out by mail.
 */
export function ContractForm({ kind }: { kind: ContractKind }) {
  const t = useT();
  const locale = useLocale();
  const lp = useLocalePath();
  const cancel = kind === "cancel";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cancelType, setCancelType] = useState<CancelType>("ordinary");
  const [reason, setReason] = useState("");
  const [when, setWhen] = useState<CancelWhen>("asap");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; receivedAt: number; data: ContractDeclaration } | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (cancel && when === "date" && !date) {
      setError(t("Bitte wähl das Datum, zu dem du kündigen möchtest.", "Please pick the date you want to cancel on."));
      return;
    }
    const data: ContractDeclaration = {
      kind,
      contract: "basic",
      name: name.trim(),
      email: email.trim().toLowerCase(),
      ...(cancel
        ? {
            cancelType,
            ...(cancelType === "extraordinary" && reason.trim() ? { reason: reason.trim() } : {}),
            when,
            ...(when === "date" ? { date } : {}),
          }
        : {}),
    };
    setBusy(true);
    try {
      const res = await fetch("/api/vertrag", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; receivedAt?: number; error?: string };
      if (!res.ok || !body.id || !body.receivedAt) throw new Error(body.error ?? `http-${res.status}`);
      setDone({ id: body.id, receivedAt: body.receivedAt, data });
      window.scrollTo({ top: 0 });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(
        code === "rate-limited"
          ? t("Zu viele Versuche. Bitte warte ein paar Minuten.", "Too many attempts. Please wait a few minutes.")
          : code === "email"
            ? t("Bitte gib eine gültige Mailadresse an.", "Please enter a valid email address.")
            : code === "name"
              ? t("Bitte gib deinen Namen an.", "Please enter your name.")
              : code === "date"
                ? t("Bitte wähl ein gültiges Datum.", "Please pick a valid date.")
                : t(
                    `Das hat nicht geklappt. Bitte versuch es nochmal oder schreib an ${OPERATOR.email}.`,
                    `That did not work. Please try again or write to ${OPERATOR.email}.`,
                  ),
      );
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="fade-up">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
          <CircleCheck size={22} strokeWidth={1.75} />
        </div>
        <h1 className="h2 mt-4 text-ink">
          {cancel ? t("Deine Kündigung ist eingegangen", "We have received your cancellation") : t("Dein Widerruf ist eingegangen", "We have received your withdrawal")}
        </h1>
        <p className="mt-3 leading-relaxed text-muted">
          {t(
            `Eingegangen am ${formatDateTime(done.receivedAt, locale)}. Eine Bestätigung mit allen Angaben geht an ${done.data.email}.`,
            `Received on ${formatDateTime(done.receivedAt, locale)}. A confirmation with all details is on its way to ${done.data.email}.`,
          )}
        </p>
        <div className="card mt-6 p-4">
          <p className="ui-label">{t("Deine Erklärung", "Your declaration")}</p>
          <dl className="mt-3 grid gap-2 text-ui-medium">
            {declarationLines(done.data, locale).map((line) => (
              <div key={line.label} className="grid gap-0.5 sm:grid-cols-[180px_1fr] sm:gap-3">
                <dt className="text-muted">{line.label}</dt>
                <dd className="whitespace-pre-line break-words text-ink">{line.value}</dd>
              </div>
            ))}
            <div className="grid gap-0.5 sm:grid-cols-[180px_1fr] sm:gap-3">
              <dt className="text-muted">{t("Eingangsnummer", "Reference")}</dt>
              <dd className="break-all text-ink">{done.id}</dd>
            </div>
          </dl>
        </div>
        <button type="button" className="btn btn-lg mt-5 print:hidden" onClick={() => window.print()}>
          <Printer size={15} strokeWidth={1.75} />
          {t("Drucken oder als PDF speichern", "Print or save as PDF")}
        </button>
        <p className="mt-5 text-ui-small leading-relaxed text-faint">
          {t(
            `Kommt in den nächsten Minuten keine Mail an, schau im Spam nach oder schreib an ${OPERATOR.email}.`,
            `If no email arrives within a few minutes, check your spam folder or write to ${OPERATOR.email}.`,
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <p className="ui-label">{t("Vertrag", "Contract")}</p>
      <h1 className="h1 mt-2 text-ink md:text-[40px]">
        {cancel ? t("Verträge hier kündigen", "Cancel contracts here") : t("Vertrag widerrufen", "Withdraw from contract")}
      </h1>
      <p className="mt-3 leading-relaxed text-muted">
        {cancel
          ? t(
              "Hier kündigst du dein Abo bei Pairspace, ohne Anmeldung. Den Eingang bestätigen wir dir sofort per Mail, mit Datum und Uhrzeit.",
              "Cancel your Pairspace subscription here, without signing in. We confirm receipt by email straight away, with date and time.",
            )
          : t(
              "Hier widerrufst du dein Abo bei Pairspace, ohne Anmeldung. Das geht innerhalb von 14 Tagen nach Abschluss. Den Eingang bestätigen wir dir sofort per Mail, mit Datum und Uhrzeit.",
              "Withdraw from your Pairspace subscription here, without signing in. You can do this within 14 days of subscribing. We confirm receipt by email straight away, with date and time.",
            )}
      </p>

      <div className="mt-8 grid gap-5">
        <div>
          <span className="mb-1.5 block text-ui-small font-medium text-muted">{t("Vertrag", "Contract")}</span>
          <div className="card px-3 py-2.5 text-ui-medium text-ink">
            {t("Pairspace Basic, Abo für Vermieter", "Pairspace Basic, subscription for landlords")}
          </div>
        </div>

        <Field label={t("Dein Name", "Your name")}>
          <input
            className="input input-lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={LIMITS.name}
            required
          />
        </Field>

        <Field
          label={t("Mail", "Email")}
          hint={t(
            "Die Mailadresse deines Pairspace-Kontos. Dorthin schicken wir die Bestätigung.",
            "The email address of your Pairspace account. We send the confirmation there.",
          )}
        >
          <input
            className="input input-lg"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={LIMITS.email}
            required
          />
        </Field>

        {cancel ? (
          <>
            <fieldset>
              <legend className="mb-1.5 block text-ui-small font-medium text-muted">{t("Art der Kündigung", "Type of cancellation")}</legend>
              <div className="grid gap-2">
                <Choice
                  name="cancelType"
                  checked={cancelType === "ordinary"}
                  onChange={() => setCancelType("ordinary")}
                  title={t("Ordentliche Kündigung", "Ordinary cancellation")}
                  text={t("Zum Ende des laufenden Zeitraums.", "Effective at the end of the current period.")}
                />
                <Choice
                  name="cancelType"
                  checked={cancelType === "extraordinary"}
                  onChange={() => setCancelType("extraordinary")}
                  title={t("Außerordentliche Kündigung", "Extraordinary cancellation")}
                  text={t("Aus wichtigem Grund, ohne Frist.", "For good cause, without notice.")}
                />
              </div>
            </fieldset>

            {cancelType === "extraordinary" ? (
              <Field label={t("Grund", "Reason")} hint={t("Freiwillig", "Optional")}>
                <textarea
                  className="input"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={LIMITS.reason}
                />
              </Field>
            ) : null}

            <fieldset>
              <legend className="mb-1.5 block text-ui-small font-medium text-muted">{t("Zeitpunkt", "Date")}</legend>
              <div className="grid gap-2">
                <Choice
                  name="when"
                  checked={when === "asap"}
                  onChange={() => setWhen("asap")}
                  title={t("Zum nächstmöglichen Zeitpunkt", "At the earliest possible date")}
                />
                <Choice
                  name="when"
                  checked={when === "date"}
                  onChange={() => setWhen("date")}
                  title={t("Zu einem bestimmten Datum", "On a specific date")}
                >
                  {when === "date" ? (
                    <input
                      className="input input-lg mt-2 max-w-[220px]"
                      type="date"
                      min={today}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-label={t("Datum", "Date")}
                      required
                    />
                  ) : null}
                </Choice>
              </div>
            </fieldset>
          </>
        ) : null}

        <ErrorText>{error}</ErrorText>

        <button type="submit" className="btn btn-cta btn-lg w-full" disabled={busy}>
          {busy ? <Spinner size={14} /> : null}
          {cancel ? t("Jetzt kündigen", "Cancel now") : t("Widerruf bestätigen", "Confirm withdrawal")}
        </button>

        <p className="text-ui-small leading-relaxed text-faint">
          {t("Wir speichern deine Angaben als Nachweis. Mehr in der ", "We keep your details as proof. More in the ")}
          <Link href={lp("/datenschutz")} className="text-muted underline-offset-2 hover:text-ink hover:underline">
            {t("Datenschutzerklärung", "privacy policy")}
          </Link>
          {". "}
          {cancel
            ? t("Innerhalb von 14 Tagen nach Abschluss kannst du stattdessen auch ", "Within 14 days of subscribing you can also ")
            : t("Nach den 14 Tagen kannst du ", "After the 14 days you can ")}
          <Link
            href={lp(cancel ? "/widerrufen" : "/kuendigen")}
            className="text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            {cancel ? t("widerrufen", "withdraw instead") : t("kündigen", "cancel")}
          </Link>
          .
        </p>
      </div>
    </form>
  );
}

function Choice({
  name,
  checked,
  onChange,
  title,
  text,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
        checked ? "border-accent-line bg-accent-soft" : "border-line bg-base-10 hover:border-base-40"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 shrink-0 accent-[hsl(254_80%_68%)]" />
      <span className="min-w-0 flex-1">
        <span className="block text-ui-medium text-ink">{title}</span>
        {text ? <span className="mt-0.5 block text-ui-small text-muted">{text}</span> : null}
        {children}
      </span>
    </label>
  );
}
