import type { Metadata } from "next";

import { EventDashboard } from "./EventDashboard";

export const metadata: Metadata = {
  title: "Event overview",
  robots: { index: false, follow: false },
};

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventDashboard eventId={eventId} />;
}
