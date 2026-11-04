import type { Metadata } from "next";

import { ApplicantFlow } from "@/components/applicant/ApplicantFlow";
import { toLocale, translator } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; flatId: string }>;
}): Promise<Metadata> {
  const t = translator(toLocale((await params).lang));
  return {
    title: t("Bewerbung", "Application"),
    description: t(
      "Schätz deine Mitbewerber ein, sortier die Zimmer und leg dein Profil an.",
      "Rate the other applicants, rank the rooms and set up your profile.",
    ),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function ApplyPage({ params }: { params: Promise<{ lang: string; flatId: string }> }) {
  const { flatId } = await params;
  return <ApplicantFlow flatId={flatId} />;
}
