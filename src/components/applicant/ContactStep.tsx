"use client";

import { Bell, CircleCheck, KeyRound, Lock } from "lucide-react";
import { useState } from "react";

import { ErrorText, Field, Toggle } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { authErrorMessage, useAuth } from "@/lib/firebase/auth";
import { saveContact } from "@/lib/firebase/data";
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
      if (!email && u.email) setEmail(u.email);
    } catch (e) {
      setLinkError(authErrorMessage(e));
    }
  };

  const save = async () => {
    const mail = email.trim();
    if (!MAIL.test(mail)) {
      setError("Bitte gib eine gültige Mail an. Nur so kann dich der Vermieter erreichen.");
      return;
    }
    setError("");
    setLinkError("");
    setBusy(true);
    try {
      await saveContact(flatId, uid, { email: mail, phone: phone.trim(), notify });
    } catch {
      setError("Speichern hat nicht geklappt. Prüf deine Verbindung.");
      setBusy(false);
      return;
    }
    if (showAccount && password) {
      try {
        await linkEmail(mail, password);
        setLinked(true);
      } catch (e) {
        setLinkError(authErrorMessage(e) || "Das Konto konnte nicht angelegt werden.");
        setBusy(false);
        return;
      }
    }
    onDone();
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <FlowHeader
        title={returning ? "Kontakt" : flatTitle}
        subtitle={returning ? undefined : "Schritt 4 von 4"}
        onBack={onBack}
        step={returning ? undefined : 3}
      />
      <Column className="flex-1 pt-5">
        <h1 className="h3 text-ink">Wie erreicht dich der Vermieter?</h1>
        <p className="mt-2 flex items-start gap-1.5 text-ui-medium leading-relaxed text-muted">
          <Lock size={14} strokeWidth={1.75} className="mt-1 shrink-0 text-faint" />
          Diese Angaben sieht nur der Vermieter, nie die anderen Bewerber.
        </p>

        <div className="mt-5 grid gap-4">
          <Field label="Mail">
            <input
              className="input input-lg"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
            />
          </Field>
          <Field label="Telefon" hint="Freiwillig">
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
              Schick mir eine Mail, wenn neue Mitbewerber dazukommen oder der Vermieter sich meldet.
            </p>
            <Toggle checked={notify} onChange={setNotify} label="Benachrichtigungen per Mail" />
          </div>
          <ErrorText>{error}</ErrorText>
        </div>

        {isAnonymous || linked ? (
          <section className="mt-8 border-t border-line pt-5">
            <h2 className="flex items-center gap-2 text-ui-medium font-semibold text-ink">
              <KeyRound size={15} strokeWidth={1.75} className="text-faint" />
              Konto sichern
              <span className="text-ui-smaller font-normal text-faint">freiwillig</span>
            </h2>
            {linked ? (
              <p className="mt-3 flex items-center gap-2 text-ui-small text-green">
                <CircleCheck size={15} strokeWidth={1.75} />
                Gesichert. Du kommst jetzt von jedem Gerät zurück.
              </p>
            ) : (
              <>
                <p className="mt-1.5 text-ui-small leading-relaxed text-muted">
                  Gerade bist du nur in diesem Browser angemeldet. Sicher dein Konto, damit du von jedem Gerät
                  zurückkommst.
                </p>
                <button type="button" className="btn btn-lg mt-4 w-full" onClick={google}>
                  <GoogleMark />
                  Mit Google sichern
                </button>
                <div className="my-4 flex items-center gap-3 text-ui-smaller text-faint">
                  <span className="divider flex-1" /> oder <span className="divider flex-1" />
                </div>
                <Field label="Passwort festlegen" hint="Mindestens 6 Zeichen. Angemeldet wirst du dann mit deiner Mail.">
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
          {returning ? "Speichern" : "Bewerbung abschließen"}
        </button>
      </BottomBar>
    </div>
  );
}
