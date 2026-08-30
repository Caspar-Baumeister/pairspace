import type { Metadata } from "next";

import { LegalLayout } from "@/components/site/LegalLayout";

export const metadata: Metadata = {
  title: "Terms",
  description: "The rules for using Pairspace as an organizer or as a participant.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms" updated="30 August 2026">
      <p>
        This is a working draft. Have it reviewed by a lawyer in your jurisdiction before you go
        live.
      </p>

      <h2>What the service does</h2>
      <p>
        Pairspace lets an event organizer publish one link so participants of that event can find a
        partner for an activity. It is not a dating service, not a social network and not event
        management software.
      </p>

      <h2>Organizer responsibilities</h2>
      <ul>
        <li>You may only invite people who are actually attending your event.</li>
        <li>You choose the categories and questions and are responsible for what you ask.</li>
        <li>You may not ask for special category personal data such as health information.</li>
      </ul>

      <h2>Participant conduct</h2>
      <ul>
        <li>Use your real first name and describe yourself honestly.</li>
        <li>Contact people only about the event you both joined.</li>
        <li>Harassment leads to removal from the event by the organizer.</li>
      </ul>

      <h2>Availability</h2>
      <p>
        The service is provided as it is. Creating events and matching participants is currently free
        of charge, and we may change that with notice for future events.
      </p>
    </LegalLayout>
  );
}
