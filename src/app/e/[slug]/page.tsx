import type { Metadata } from "next";

import { EventScreen } from "./EventScreen";

export const metadata: Metadata = {
  title: "Find a partner for this event",
  description:
    "Introduce yourself, see who else is looking for a partner, or get notified when someone matching joins.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EventScreen slug={slug} />;
}
