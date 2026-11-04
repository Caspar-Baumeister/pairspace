import type { Metadata } from "next";

import { LandlordGate } from "./LandlordGate";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <LandlordGate>{children}</LandlordGate>;
}
