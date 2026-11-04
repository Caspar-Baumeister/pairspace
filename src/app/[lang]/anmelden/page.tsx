import type { Metadata } from "next";
import { Suspense } from "react";

import { FullScreenSpinner } from "@/components/ui/Spinner";
import { toLocale, translator } from "@/lib/i18n";

import { SignIn } from "./SignIn";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const t = translator(toLocale((await params).lang));
  return {
    title: t("Anmelden", "Sign in"),
    robots: { index: false, follow: false },
  };
}

export default function SignInPage() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <SignIn />
    </Suspense>
  );
}
