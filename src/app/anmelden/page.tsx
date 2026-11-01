import type { Metadata } from "next";
import { Suspense } from "react";

import { FullScreenSpinner } from "@/components/ui/Spinner";

import { SignIn } from "./SignIn";

export const metadata: Metadata = {
  title: "Anmelden",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <SignIn />
    </Suspense>
  );
}
