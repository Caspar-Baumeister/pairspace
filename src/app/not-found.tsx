import Link from "next/link";

import { MascotSearch } from "@/components/mascot/Scenes";

export default function NotFound() {
  return (
    <div className="wash flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-[420px] text-center">
        <div className="pop mx-auto w-[200px]">
          <MascotSearch className="w-full" label="Kai shades his eyes and looks around" />
        </div>
        <p className="eyebrow mt-4">Nothing here</p>
        <h1 className="display-m mt-3">Kai looked everywhere</h1>
        <p className="mt-3 text-[1rem] font-medium text-ink-muted">
          This page does not exist. If you were following an event link, check it with the person
          who sent it to you.
        </p>
        <Link href="/" className="btn btn-primary mt-7 w-full sm:w-auto">
          Go to the homepage
        </Link>
      </div>
    </div>
  );
}
