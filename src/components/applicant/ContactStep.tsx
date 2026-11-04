"use client";

import { Bell, CircleCheck, KeyRound, Lock } from "lucide-react";
import { useState } from "react";

import { ErrorText, Field, Toggle } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { track } from "@/lib/analytics";
import { authErrorMessage, useAuth } from "@/lib/firebase/auth";
import { saveContact } from "@/lib/firebase/data";
import { useLocale, useT } from "@/lib/i18n/client";
import type { ApplicantContact } from "@/lib/types";
import { BottomBar, Column, FlowHeader } from "./FlowShell";

const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

/**
 * Mail, phone and notifications, all private to the landlord. Anonymous
 * applicants can secure their session here with Google or a password, so
 * they can come back from another device.
 */
export function ContactStep({
  flatId,
  uid,
  flatTitle,
  contact,
  returning,
  onDone,
  onBack,
}: {
  flatId: string;
  uid: string;
  flatTitle: string;
  contact: ApplicantContact | null;
  returning: boolean;
  onDone: () => void;
  onBack?: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const { user, isAnonymous, linkGoogle, linkEmail } = useAuth();
  const [email, setEmail] = useState(contact?.email ?? user?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [notify, setNotify] = useState(contact?.notify ?? true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linked, setLinked] = useState(false);
  const [busy, setBusy] = useState(false);
  const showAccount = isAnonymous && !linked;

  const google = async () => {
    setLinkError("");
    try {
      const u = await linkGoogle();
      setLinked(true);
      track("applicant_account_secured", { method: "google" });
      if (!email && u.email) setEmail(u.email);
    } catch (e) {
      setLinkError(authErrorMessage(e, t));
    }
  };

  const save = async () => {
    const mail = email.trim();
    if (!MAIL.test(mail)) {
      setError(
        t(
          "Bitte gib eine gültige Mail an. Nur so kann dich der Vermieter erreichen.",
          "Please enter a valid email. It is the only way the landlord can reach you.",
        ),
      );
      return;
    }
    setError("");
    setLinkError("");
    setBusy(true);
    try {
      await saveContact(flatId, uid, { email: mail, phone: phone.trim(), notify, locale });
    } catch {
      setError(t("Speichern hat nicht geklappt. Prüf deine Verbindung.", "Saving did not work. Check your connection."));
      setBusy(false);
      return;
    }
    if (showAccount && password) {
      try {
        await linkEmail(mail, password);
        setLinked(true);
        track("applicant_account_secured", { method: "password" });
      } catch (e) {
        setLinkError(
          authErrorMessage(e, t) || t("Das Konto konnte nicht angelegt werden.", "The account could not be created."),
        );
        setBusy(false);
        return;
      }
    }
    if (!returning) track("applicant_contact_done", { notify });
    onDone();
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <FlowHeader
        title={returning ? t("Kontakt", "Contact") : flatTitle}
        subtitle={returning ? undefined : t("Schritt 4 von 4", "Step 4 of 4")}
        onBack={onBack}
        step={returning ? undefined : 3}
        flatId={flatId}
      />
      <Column className="flex-1 pt-5">
        <h1 className="h3 text-ink">{t("Wie erreicht dich der Vermieter?", "How can the landlord reach you?")}</h1>
        <p className="mt-2 flex items-start gap-1.5 text-ui-medium leading-relaxed text-muted">
          <Lock size={14} strokeWidth={1.75} className="mt-1 shrink-0 text-faint" />
          {t(
            "Diese Angaben sieht nur der Vermieter, nie die anderen Bewerber.",
            "Only the landlord sees these details, never the other applicants.",
          )}
        </p>

        <div className="mt-5 grid gap-4">
          <Field label={t("Mail", "Email")}>
            <input
              className="input input-lg"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("du@beispiel.de", "you@example.com")}
            />
          </Field>
          <Field label={t("Telefon", "Phone")} hint={t("Freiwillig", "Optional")}>
            <input
              className="input input-lg"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <div className="card flex items-center gap-3 p-3">
            <Bell size={16} strokeWidth={1.75} className="shrink-0 text-faint" />
            <p className="flex-1 text-ui-small text-ink">
              {t(
                "Schick mir eine Mail, wenn neue Mitbewerber dazukommen oder der Vermieter sich meldet.",
                "Email me when new applicants join or the landlord gets in touch.",
              )}
            </p>
            <Toggle checked={notify} onChange={setNotify} label={t("Benachrichtigungen per Mail", "Email notifications")} />
          </div>
          <ErrorText>{error}</ErrorText>
        </div>

        {isAnonymous || linked ? (
          <section className="mt-8 border-t border-line pt-5">
            <h2 className="flex items-center gap-2 text-ui-medium font-semibold text-ink">
              <KeyRound size={15} strokeWidth={1.75} className="text-faint" />
              {t("Konto sichern", "Save your account")}
              <span className="text-ui-smaller font-normal text-faint">{t("freiwillig", "optional")}</span>
            </h2>
            {linked ? (
              <p className="mt-3 flex items-center gap-2 text-ui-small text-green">
                <CircleCheck size={15} strokeWidth={1.75} />
                {t("Gesichert. Du kommst jetzt von jedem Gerät zurück.", "Saved. You can now come back from any device.")}
              </p>
            ) : (
              <>
                <p className="mt-1.5 text-ui-small leading-relaxed text-muted">
                  {t(
                    "Gerade bist du nur in diesem Browser angemeldet. Sicher dein Konto, damit du von jedem Gerät zurückkommst.",
                    "Right now you are only signed in on this browser. Save your account so you can come back from any device.",
                  )}
                </p>
                <button type="button" className="btn btn-lg mt-4 w-full" onClick={google}>
                  <GoogleMark />
                  {t("Mit Google sichern", "Save with Google")}
                </button>
                <div className="my-4 flex items-center gap-3 text-ui-smaller text-faint">
                  <span className="divider flex-1" /> {t("oder", "or")} <span className="divider flex-1" />
                </div>
                <Field
                  label={t("Passwort festlegen", "Choose a password")}
                  hint={t(
                    "Mindestens 6 Zeichen. Angemeldet wirst du dann mit deiner Mail.",
                    "At least 6 characters. You then sign in with your email.",
                  )}
                >
                  <input
                    className="input input-lg"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <ErrorText>{linkError}</ErrorText>
              </>
            )}
          </section>
        ) : null}
      </Column>

      <BottomBar>
        <button type="button" className="btn btn-cta btn-lg w-full" onClick={save} disabled={busy}>
          {busy ? <Spinner size={14} /> : null}
          {returning ? t("Speichern", "Save") : t("Bewerbung abschließen", "Finish application")}
        </button>
      </BottomBar>
    </div>
  );
}
