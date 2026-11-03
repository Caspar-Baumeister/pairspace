"use client";

import { FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { FlatBasicsForm } from "@/components/flat/FlatBasicsForm";
import { StepHeader } from "@/components/flat/StepHeader";
import { useAuth } from "@/lib/firebase/auth";
import { createFlat } from "@/lib/firebase/data";

export default function NewFlatPage() {
  const { user } = useAuth();
  const { landlord } = useShell();
  const router = useRouter();

  return (
    <>
      <PaneHeader icon={FilePlus2} title="Neue Wohnung" />
      <PaneBody>
        <div className="fade-up">
          <StepHeader step={1} total={5} title="Deine Wohnung" text="Fang mit dem Wichtigsten an. Alles lässt sich später ändern." />
          <FlatBasicsForm
            submitLabel="Weiter zu den Zimmern"
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
              );
              router.push(`/app/w/${id}/einrichten`);
            }}
          />
        </div>
      </PaneBody>
    </>
  );
}
