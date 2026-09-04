export interface FaqItem {
  q: string;
  a: string;
}

/** Shared by the FAQ section and the FAQPage structured data on the landing page. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "How do participants find a partner at my event?",
    a: "You share one event link. Participants open it, pick their category such as Base, Flyer, Leader or Follower, answer the questions you defined, and immediately see the people who fit. They send one request, and contact details are exchanged only when both sides agree.",
  },
  {
    q: "Do participants need to download an app or create an account?",
    a: "No. The event link opens in any browser. There is no app store step and no password. A participant profile exists inside your event only and is deleted after the retention window you choose.",
  },
  {
    q: "What if someone does not want to browse profiles?",
    a: "They can choose notify me instead. They leave an email address and what they are looking for, without creating a profile. When a matching participant joins, they get one email.",
  },
  {
    q: "Can I use my own participant categories?",
    a: "Yes. Base and Flyer, Leader and Follower, mentor and mentee, or anything specific to your event such as role, level, availability or team size. You decide which categories can pair with which.",
  },
  {
    q: "Is this a dating service?",
    a: "No. Pairspace is participant matching for events. People pair up for an activity such as an acro jam, a dance workshop or a hackathon team. There are no dating features, no swiping and no public profiles.",
  },
  {
    q: "What does it cost to create an event?",
    a: "Creating an event and sharing the link is free. You only sign in at the end of the setup, with Google or Apple, so your event link stays in your account and you can come back to it.",
  },
  {
    q: "How is participant data protected?",
    a: "Contact details are never visible to other participants. Each person decides whether to leave an email address, a WhatsApp number, or nothing at all and just check the link. Profiles are scoped to a single event, never indexed by search engines, and deleted automatically once the retention window closes.",
  },
  {
    q: "Can I see how balanced my event is?",
    a: "Yes. The organizer dashboard shows live counts of participants, how many are still open, how many connections were made and the balance between your categories, so you can act while there is still time.",
  },
];
