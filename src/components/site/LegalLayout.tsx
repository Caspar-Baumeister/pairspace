import { Footer } from "./Footer";
import { Nav } from "./Nav";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main id="main" className="px-6 py-20">
        <article className="mx-auto w-full max-w-[680px]">
          <p className="eyebrow">Legal</p>
          <h1 className="display-l mt-4">{title}</h1>
          <p className="mt-4 text-[0.875rem] text-ink-faint">Last updated {updated}</p>
          <div className="mt-12 space-y-8 text-[1rem] leading-relaxed text-ink-secondary [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[1.25rem] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_li]:mb-2 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
