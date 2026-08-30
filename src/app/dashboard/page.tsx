import type { Metadata } from "next";

import { DashboardScreen } from "./DashboardScreen";

export const metadata: Metadata = {
  title: "My events",
  description: "Your events, their links and live participant statistics.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
