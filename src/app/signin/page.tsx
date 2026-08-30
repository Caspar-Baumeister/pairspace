import type { Metadata } from "next";

import { SignInScreen } from "./SignInScreen";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to see the events you created and their participant statistics.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <SignInScreen />;
}
