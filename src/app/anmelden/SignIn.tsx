"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/ui/Logo";
import { ErrorText, Field } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { authErrorMessage, useAuth } from "@/lib/firebase/auth";
import { ensureLandlord } from "@/lib/firebase/data";

type Mode = "signin" | "signup";

export function SignIn() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("weiter")?.startsWith("/app") ? params.get("weiter")! : "/app";
  const [mode, setMode] = useState<Mode>(params.get("neu") ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // While a sign in runs, run() redirects itself once the landlord doc exists.
    if (!loading && !busy && user && !user.isAnonymous) router.replace(next);
  }, [loading, busy, user, next, router]);

  const run = async (fn: () => Promise<import("firebase/auth").User>, displayName?: string) => {
    setBusy(true);
    setError("");
    try {
      const u = await fn();
      await ensureLandlord(u, displayName);
      router.replace(next);
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="modal w-full max-w-[380px] p-6">
        <h1 className="text-ui-large font-semibold">{mode === "signup" ? "Konto erstellen" : "Willkommen zurück"}</h1>
        <p className="mt-1 text-ui-small text-muted">
          {mode === "signup"
            ? "Leg deine erste Wohnung an und teile den Link mit deinen Bewerbern."
            : "Melde dich an, um deine Wohnungen und Bewerber zu sehen."}
        </p>

        <button
          type="button"
          className="btn btn-lg mt-5 w-full"
          disabled={busy}
          onClick={() => run(signInWithGoogle)}
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
          </svg>
          Mit Google fortfahren
        </button>

        <div className="my-5 flex items-center gap-3 text-ui-smaller text-faint">
          <span className="divider flex-1" /> oder mit Mail <span className="divider flex-1" />
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "signup") run(() => signUpWithEmail(email.trim(), password, name.trim()), name.trim());
            else run(() => signInWithEmail(email.trim(), password));
          }}
        >
          {mode === "signup" ? (
            <Field label="Dein Name">
              <input className="input input-lg" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </Field>
          ) : null}
          <Field label="Mail">
            <input
              className="input input-lg"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Passwort">
            <input
              className="input input-lg"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <button type="submit" className="btn btn-cta btn-lg w-full" disabled={busy}>
            {busy ? <Spinner size={14} /> : null}
            {mode === "signup" ? "Konto erstellen" : "Anmelden"}
          </button>
        </form>

        <p className="mt-5 text-center text-ui-small text-muted">
          {mode === "signup" ? "Schon ein Konto?" : "Noch kein Konto?"}{" "}
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError("");
            }}
          >
            {mode === "signup" ? "Anmelden" : "Konto erstellen"}
          </button>
        </p>
      </div>
    </div>
  );
}
