import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-6">
      <div className="max-w-[420px] text-center">
        <p className="eyebrow">Nothing here</p>
        <h1 className="display-m mt-4">This page does not exist</h1>
        <p className="mt-4 text-[0.9375rem] text-ink-muted">
          If you were following an event link, check it with the person who sent it to you.
        </p>
        <Link href="/" className="btn btn-primary mt-7">
          Go to the homepage
        </Link>
      </div>
    </div>
  );
}
