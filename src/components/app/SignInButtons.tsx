"use client";

import { useState } from "react";

import { useAuth } from "@/lib/firebase/auth";

export function SignInButtons({
  onSignedIn,
  label = "Continue",
}: {
  onSignedIn?: () => void | Promise<void>;
  label?: string;
}) {
  const { signInWithGoogle, signInWithApple, configured } = useAuth();
  const [busy, setBusy] = useState<null | "google" | "apple">(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "google" | "apple") {
    setError(null);
    setBusy(kind);
    try {
      if (kind === "google") await signInWithGoogle();
      else await signInWithApple();
      await onSignedIn?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sign in failed";
      setError(message.replace("Firebase: ", ""));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="btn btn-secondary w-full"
        onClick={() => run("google")}
        disabled={!configured || busy !== null}
      >
        <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
        {busy === "google" ? "Opening Google" : `${label} with Google`}
      </button>

      <button
        type="button"
        className="btn btn-secondary w-full"
        onClick={() => run("apple")}
        disabled={!configured || busy !== null}
      >
        <svg width="15" height="17" viewBox="0 0 16 19" fill="currentColor" aria-hidden="true">
          <path d="M13.2 10.1c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.7-3.1.7-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2-1.4 2.5-.4 6.2 1 8.3.7 1 1.5 2.1 2.5 2.1 1 0 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.8-1 2.4-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2-.8-2-3.2ZM11.2 3.7c.5-.7.9-1.6.8-2.6-.8 0-1.8.5-2.4 1.2-.5.6-1 1.6-.8 2.5.9.1 1.8-.4 2.4-1.1Z" />
        </svg>
        {busy === "apple" ? "Opening Apple" : `${label} with Apple`}
      </button>

      {!configured ? (
        <p className="text-[0.8125rem] text-warning">
          Firebase is not configured yet. Add your keys to .env.local to enable sign in.
        </p>
      ) : null}
      {error ? <p className="text-[0.8125rem] text-danger">{error}</p> : null}
    </div>
  );
}
