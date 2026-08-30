import type { Metadata } from "next";

import { LegalLayout } from "@/components/site/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Pairspace handles participant data: event scoped profiles, hidden email addresses and automatic deletion.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy policy" updated="30 August 2026">
      <p>
        This is a working draft that describes how the product is built. Have it reviewed by a
        lawyer in your jurisdiction before you go live.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>Organizer account: name, email address and profile picture from Google or Apple.</li>
        <li>
          Event data: the event name, location, dates, description, participant categories and
          questions you defined.
        </li>
        <li>
          Participant profile: first name, chosen categories, answers to the event questions, a
          short free text note and an email address.
        </li>
        <li>Notification requests: an email address and the categories a person is waiting for.</li>
      </ul>

      <h2>What other participants can see</h2>
      <p>
        Other participants see the first name, the categories and the answers to the questions the
        organizer defined. Email addresses are never visible in the product. An address is shared
        with exactly one other person, by email, at the moment both sides accept a connection
        request.
      </p>

      <h2>How long we keep it</h2>
      <p>
        The organizer chooses a retention window of 7, 30 or 90 days after the event ends. When that
        window passes, every participant profile, notification request and connection for that event
        is deleted automatically. Only the aggregated counts remain in the organizer history.
      </p>

      <h2>Search engines</h2>
      <p>
        Event pages and participant profiles are excluded from indexing and carry a noindex
        directive. They are reachable only through the link the organizer shares.
      </p>

      <h2>Processors</h2>
      <ul>
        <li>Google Firebase for authentication, database and hosting.</li>
        <li>An email provider for transactional notifications.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        Participants can edit or delete their profile at any time from the event page. Organizers can
        delete an entire event with all of its participant data. Write to the address in the footer
        of your event emails for anything else.
      </p>
    </LegalLayout>
  );
}
