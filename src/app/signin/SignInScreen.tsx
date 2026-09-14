"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/app/AppShell";
import { MascotWave } from "@/components/mascot/Scenes";
import { SignInButtons } from "@/components/app/SignInButtons";
import { useAuth } from "@/lib/firebase/auth";

export function SignInScreen() {
  const router = useRouter();
  const { user, isAnonymous, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && !isAnonymous) router.replace("/dashboard");
  }, [loading, user, isAnonymous, router]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[420px] pt-4">
        <div className="pop mx-auto w-[150px]">
          <MascotWave className="w-full" label="Kai waves" />
        </div>
        <p className="eyebrow mt-4">Organizers</p>
        <h1 className="display-m mt-3">Welcome back</h1>
        <p className="mt-3 text-[0.9375rem] text-ink-muted">
          Sign in to find your event links again and see who is still looking for a partner.
        </p>

        <div className="mt-8">
          <SignInButtons onSignedIn={() => router.push("/dashboard")} />
        </div>

        <p className="mt-8 text-[0.875rem] text-ink-muted">
          No event yet?{" "}
          <Link href="/create" className="font-medium text-accent hover:underline">
            Create one in two minutes
          </Link>
          .
        </p>
        <p className="mt-4 text-[0.8125rem] text-ink-faint">
          Participants never sign in. They only open the event link you share.
        </p>
      </div>
    </AppShell>
  );
}
