"use client";

import { addDoc, collection } from "firebase/firestore";
import { Bug, Check, Lightbulb, MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ErrorText, Field } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/firebase/auth";
import { firebase } from "@/lib/firebase/client";
import { useLocale, useT } from "@/lib/i18n/client";

export type FeedbackKind = "idea" | "feedback" | "bug";

/** Where the button sits, ends up in the mail so Caspar knows who wrote. */
export type FeedbackSource = "landlord" | "applicant";

const MAX_TEXT = 4000;

/**
 * Wishes, feedback and bugs go straight to feedback/{id} in Firestore. The
 * function onFeedbackCreated mails each one to Caspar, with the reply address
 * if the person left one.
 */
export function FeedbackButton({
  source,
  flatId,
  variant = "icon",
  className = "",
}: {
  source: FeedbackSource;
  flatId?: string;
  /** icon for toolbars, text for a quiet link, nav for a sidebar row (icon only once collapsed). */
  variant?: "icon" | "text" | "nav" | "nav-collapsed";
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const show = () => {
    setOpen(true);
    track("feedback_opened", { source });
  };
  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          className={`icon-btn ${className}`}
          onClick={show}
          aria-label={t("Feedback senden", "Send feedback")}
          title={t("Wünsche, Feedback, Bugs", "Ideas, feedback, bugs")}
        >
          <MessageSquare size={16} strokeWidth={1.75} />
        </button>
      ) : variant === "nav" || variant === "nav-collapsed" ? (
        <button
          type="button"
          className={`nav-item w-full text-left ${variant === "nav-collapsed" ? "justify-center px-0" : ""} ${className}`}
          onClick={show}
          aria-label={t("Feedback senden", "Send feedback")}
          title={t("Wünsche, Feedback, Bugs", "Ideas, feedback, bugs")}
        >
          <MessageSquare size={16} strokeWidth={1.75} className="shrink-0" />
          {variant === "nav" ? t("Feedback", "Feedback") : null}
        </button>
      ) : (
        <button type="button" className={`text-ui-small text-faint hover:text-muted ${className}`} onClick={show}>
          {t("Feedback oder Problem melden", "Send feedback or report a problem")}
        </button>
      )}
      {open ? <FeedbackDialog source={source} flatId={flatId} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function FeedbackDialog({ source, flatId, onClose }: { source: FeedbackSource; flatId?: string; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const { user, isAnonymous, ensureAnonymous } = useAuth();
  const [kind, setKind] = useState<FeedbackKind>("idea");
  const [text, setText] = useState("");
  const [email, setEmail] = useState(user && !isAnonymous ? (user.email ?? "") : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const KINDS: { value: FeedbackKind; label: string; icon: typeof Bug; placeholder: string }[] = [
    {
      value: "idea",
      label: t("Wunsch", "Idea"),
      icon: Lightbulb,
      placeholder: t("Was fehlt dir? Was würde dir Zeit sparen?", "What is missing? What would save you time?"),
    },
    {
      value: "feedback",
      label: "Feedback",
      icon: MessageSquare,
      placeholder: t("Was gefällt dir, was nervt?", "What do you like, what annoys you?"),
    },
    {
      value: "bug",
      label: "Bug",
      icon: Bug,
      placeholder: t(
        "Was hast du gemacht, was ist passiert, was hättest du erwartet?",
        "What did you do, what happened, what did you expect?",
      ),
    },
  ];
  const current = KINDS.find((k) => k.value === kind)!;

  const send = async () => {
    const message = text.trim();
    if (!message) {
      setError(t("Schreib kurz, worum es geht.", "Write a few words about it."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const me = user ?? (await ensureAnonymous());
      await addDoc(collection(firebase().db, "feedback"), {
        uid: me.uid,
        kind,
        text: message.slice(0, MAX_TEXT),
        email: email.trim().slice(0, 200) || null,
        source,
        flatId: flatId ?? null,
        page: window.location.pathname.slice(0, 300),
        locale,
        userAgent: navigator.userAgent.slice(0, 300),
        createdAt: Date.now(),
      });
      track("feedback_sent", { kind, source });
      setSent(true);
    } catch {
      setError(t("Das hat nicht geklappt. Versuch es bitte nochmal.", "That did not work. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("Feedback senden", "Send feedback")}
        className="modal max-h-[92dvh] w-full max-w-[440px] overflow-y-auto p-5 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-ui-medium font-semibold text-ink">{t("Schreib mir direkt", "Write to me directly")}</p>
            <p className="mt-1 text-ui-small text-muted">
              {t(
                "Ich baue Pairspace allein und lese jede Nachricht selbst. Caspar",
                "I build Pairspace on my own and read every message myself. Caspar",
              )}
            </p>
          </div>
          <button type="button" className="icon-btn shrink-0" onClick={onClose} aria-label={t("Schließen", "Close")}>
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {sent ? (
          <div className="py-6 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--hover)] text-accent">
              <Check size={20} strokeWidth={2} />
            </span>
            <p className="mt-4 text-ui-medium font-semibold text-ink">{t("Danke, ist angekommen.", "Thanks, it arrived.")}</p>
            <p className="mt-1 text-ui-small text-muted">
              {email.trim()
                ? t("Wenn ich Fragen habe, melde ich mich per Mail.", "If I have questions, I will reply by email.")
                : t("Ohne Mail kann ich dir nicht antworten, aber ich lese es.", "Without an email I cannot reply, but I will read it.")}
            </p>
            <button type="button" className="btn btn-lg mt-6" onClick={onClose}>
              {t("Fertig", "Done")}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-bg-2 p-1" role="radiogroup">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  role="radio"
                  aria-checked={kind === k.value}
                  onClick={() => setKind(k.value)}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-ui-small transition-colors ${
                    kind === k.value ? "bg-[var(--hover)] text-ink" : "text-faint hover:text-muted"
                  }`}
                >
                  <k.icon size={14} strokeWidth={1.75} />
                  {k.label}
                </button>
              ))}
            </div>
            <textarea
              className="input min-h-[140px]"
              value={text}
              maxLength={MAX_TEXT}
              onChange={(e) => setText(e.target.value)}
              placeholder={current.placeholder}
              aria-label={current.label}
              autoFocus
            />
            <Field
              label={t("Deine Mail für eine Antwort", "Your email for a reply")}
              hint={t("Freiwillig. Nur für diese Nachricht.", "Optional. Only used for this message.")}
            >
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@mail.de"
                autoComplete="email"
              />
            </Field>
            <ErrorText>{error}</ErrorText>
            <button type="button" className="btn btn-cta btn-lg w-full" onClick={send} disabled={busy}>
              {busy ? <Spinner size={14} /> : null}
              {t("Senden", "Send")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
