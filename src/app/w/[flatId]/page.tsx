import type { Metadata } from "next";

import { ApplicantFlow } from "@/components/applicant/ApplicantFlow";

export const metadata: Metadata = {
  title: "Bewerbung",
  description: "Schätz deine Mitbewerber ein, sortier die Zimmer und leg dein Profil an.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ApplyPage({ params }: { params: Promise<{ flatId: string }> }) {
  const { flatId } = await params;
  return <ApplicantFlow flatId={flatId} />;
}
