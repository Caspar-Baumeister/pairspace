import type { Metadata } from "next";

import { CreateWizard } from "./CreateWizard";

export const metadata: Metadata = {
  title: "Create your event",
  description:
    "Set up participant matching for your event in two minutes. Define categories, add questions, and get one link to share.",
  robots: { index: false, follow: false },
};

export default function CreatePage() {
  return <CreateWizard />;
}
