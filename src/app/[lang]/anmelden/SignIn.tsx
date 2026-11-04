"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { LanguageSwitch } from "@/components/site/LanguageSwitch";
import { Logo } from "@/components/ui/Logo";
import { ErrorText, Field } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { track } from "@/lib/analytics";
import { authErrorMessage, useAuth } from "@/lib/firebase/auth";
import { ensureLandlord } from "@/lib/firebase/data";
import { useLocalePath, useT } from "@/lib/i18n/client";

type Mode = "signin" | "signup";

/** For Google: Firebase sets both times to the same second when the account was just created. */
function isNewAccount(user: import("firebase/auth").User): boolean {
  const { creationTime, lastSignInTime } = user.metadata;
  return Boolean(creationTime && creationTime === lastSignInTime);
}

export function SignIn() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const t = useT();
  const lp = useLocalePath();
  const params = useSearchParams();
  // weiter is a path without language prefix (see LandlordGate), lp adds the current one.
  const next = lp(params.get("weiter")?.startsWith("/app") ? params.get("weiter")! : "/app");
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

  const run = async (
    method: "google" | "email",
    fn: () => Promise<import("firebase/auth").User>,
    displayName?: string,
  ) => {
    setBusy(true);
    setError("");
    try {
      const u = await fn();
      await ensureLandlord(u, displayName);
      track("signed_in", { method, new_account: method === "email" ? mode === "signup" : isNewAccount(u) });
      router.replace(next);
    } catch (e) {
      setError(authErrorMessage(e, t));
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-3 top-3">
        <LanguageSwitch source="signin" />
      </div>
      <div className="mb-8">
        <Logo />
      </div>
      <div className="modal w-full max-w-[380px] p-6">
        <h1 className="text-ui-large font-semibold">{mode === "signup" ? t("Konto erstellen", "Create account") : t("Willkommen zurück", "Welcome back")}</h1>
        <p className="mt-1 text-ui-small text-muted">
          {mode === "signup"
            ? t(
                "Leg deine erste Wohnung an und teile den Link mit deinen Bewerbern.",
                "Add your first flat and share the link with your applicants.",
              )
            : t("Melde dich an, um deine Wohnungen und Bewerber zu sehen.", "Sign in to see your flats and applicants.")}
        </p>

        <button
          type="button"
          className="btn btn-lg mt-5 w-full"
          disabled={busy}
          onClick={() => run("google", signInWithGoogle)}
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
          </svg>
          {t("Mit Google fortfahren", "Continue with Google")}
        </button>

        <div className="my-5 flex items-center gap-3 text-ui-smaller text-faint">
          <span className="divider flex-1" /> {t("oder mit Mail", "or with email")} <span className="divider flex-1" />
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "signup") run("email", () => signUpWithEmail(email.trim(), password, name.trim()), name.trim());
            else run("email", () => signInWithEmail(email.trim(), password));
          }}
        >
          {mode === "signup" ? (
            <Field label={t("Dein Name", "Your name")}>
              <input className="input input-lg" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </Field>
          ) : null}
          <Field label={t("Mail", "Email")}>
            <input
              className="input input-lg"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field label={t("Passwort", "Password")}>
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
            {mode === "signup" ? t("Konto erstellen", "Create account") : t("Anmelden", "Sign in")}
          </button>
        </form>

        <p className="mt-5 text-center text-ui-small text-muted">
          {mode === "signup" ? t("Schon ein Konto?", "Already have an account?") : t("Noch kein Konto?", "No account yet?")}{" "}
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError("");
            }}
          >
            {mode === "signup" ? t("Anmelden", "Sign in") : t("Konto erstellen", "Create account")}
          </button>
        </p>

        <p className="mt-5 border-t border-line pt-4 text-center text-ui-smaller leading-relaxed text-faint">
          {t("Mit der Anmeldung akzeptierst du die ", "By signing in, you accept the ")}
          <Link href={lp("/agb")} target="_blank" className="text-muted underline-offset-2 hover:text-ink hover:underline">
            {t("AGB", "terms")}
          </Link>
          {t(". Wie wir mit deinen Daten umgehen, steht in der ", ". How we handle your data is explained in the ")}
          <Link
            href={lp("/datenschutz")}
            target="_blank"
            className="text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            {t("Datenschutzerklärung", "privacy policy")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
