"use client";

import { useRouter } from "next/navigation";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { FlatBasicsForm } from "@/components/flat/FlatBasicsForm";
import { StepHeader } from "@/components/flat/StepHeader";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/firebase/auth";
import { createFlat } from "@/lib/firebase/data";
import { useLocale, useLocalePath, useT } from "@/lib/i18n/client";

export default function NewFlatPage() {
  const { user } = useAuth();
  const { landlord } = useShell();
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const lp = useLocalePath();

  return (
    <>
      <PaneHeader />
      <PaneBody>
        <div className="fade-up">
          <StepHeader
            step={1}
            total={5}
            title={t("Deine Wohnung", "Your flat")}
            text={t(
              "Fang mit dem Wichtigsten an. Alles lässt sich später ändern.",
              "Start with the basics. You can change everything later.",
            )}
          />
          <FlatBasicsForm
            submitLabel={t("Weiter zu den Zimmern", "Continue to the rooms")}
            onSubmit={async (values) => {
              if (!user) return;
              const id = await createFlat(
                {
                  uid: user.uid,
                  name: landlord?.name || user.displayName || "",
                  about: landlord?.about ?? "",
                  photo: landlord?.photo ?? null,
                },
                values,
                locale,
              );
              track("flat_created");
              router.push(lp(`/app/w/${id}/einrichten`));
            }}
          />
        </div>
      </PaneBody>
    </>
  );
}
