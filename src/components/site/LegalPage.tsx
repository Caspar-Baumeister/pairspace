import type { Block, Inline, LegalDoc } from "@shared/doc";
import Link from "next/link";
import type { ReactNode } from "react";

import { LEGAL_UPDATED, OPERATOR } from "@/lib/legal";
import { localePath, translator, type Locale } from "@/lib/i18n";

import { SiteFooter, SiteNav } from "./SiteNav";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/**
 * Long text pages: Impressum, Datenschutz, AGB, Widerruf. Site chrome around a
 * calm reading column, one section per heading. The German text is binding,
 * English pages say so once at the top.
 */
export function LegalPage({
  locale,
  title,
  lead,
  sections,
  numbered = true,
  toc = true,
}: {
  locale: Locale;
  title: string;
  lead?: ReactNode;
  sections: LegalSection[];
  /** "1. Title" in headings and contents. */
  numbered?: boolean;
  /** Contents list at the top, only worth it for long pages. */
  toc?: boolean;
}) {
  const t = translator(locale);
  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main className="mx-auto max-w-[720px] px-4 pb-24 pt-12 md:px-6 md:pt-16">
        <p className="ui-label">{t("Rechtliches", "Legal")}</p>
        <h1 className="h1 mt-2 text-ink [overflow-wrap:anywhere] md:text-[40px]">{title}</h1>
        <p className="mt-2 text-ui-small text-faint">
          {t("Stand", "Last updated")}: {t(LEGAL_UPDATED.de, LEGAL_UPDATED.en)}
        </p>

        {locale === "en" ? (
          <p className="mt-6 rounded-xl border border-accent-line bg-accent-soft p-4 text-ui-small leading-relaxed text-ink">
            This is a courtesy translation. Only the German version is legally binding. To read it, switch the
            language to DE.
          </p>
        ) : null}

        {lead ? <div className="mt-6 text-[17px] leading-relaxed text-muted">{lead}</div> : null}

        {toc && sections.length > 3 ? (
          <nav aria-label={t("Inhalt", "Contents")} className="card mt-8 p-4">
            <p className="ui-label">{t("Inhalt", "Contents")}</p>
            <ol className="mt-2 grid gap-x-6 gap-y-1 text-ui-small sm:grid-cols-2">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted transition-colors hover:text-ink">
                    {numbered ? <span className="text-faint">{i + 1}. </span> : null}
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="mt-10">
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              className="mt-8 scroll-mt-24 border-t border-line pt-8 first:mt-0 first:border-t-0 first:pt-0"
            >
              <h2 className="h4 text-ink">
                {numbered ? <span className="text-faint">{i + 1}. </span> : null}
                {s.title}
              </h2>
              <div className={PROSE}>{s.body}</div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** Reading type for the section bodies, children stay plain HTML. */
const PROSE = [
  // No automatic hyphens: they would split mail addresses and domains, which then read as part of them.
  "mt-3 space-y-3 text-[16px] leading-[1.7] text-muted [overflow-wrap:break-word]",
  "[&_a]:text-accent [&_a:hover]:underline",
  "[&_strong]:font-semibold [&_strong]:text-ink",
  "[&_h3]:pt-3 [&_h3]:text-ui-medium [&_h3]:font-semibold [&_h3]:text-ink",
  "[&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:marker:text-faint",
  "[&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ol]:marker:text-faint",
].join(" ");

/* -------------------------------------------------- shared text documents */

/** Sections of a text from functions/src/shared, for the sections prop. */
export function docSections(doc: LegalDoc, locale: Locale): LegalSection[] {
  return doc.sections.map((s) => ({ id: s.id, title: s.title, body: <DocBlocks blocks={s.blocks} locale={locale} /> }));
}

function DocBlocks({ blocks, locale }: { blocks: Block[]; locale: Locale }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "p":
            return (
              <p key={i} className={block.small ? "text-ui-small text-faint" : undefined}>
                <DocInline parts={block.text} locale={locale} />
              </p>
            );
          case "h3":
            return <h3 key={i}>{block.text}</h3>;
          case "ul":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <DocInline parts={item} locale={locale} />
                  </li>
                ))}
              </ul>
            );
          case "box":
            return (
              <Callout key={i}>
                <DocBlocks blocks={block.blocks} locale={locale} />
              </Callout>
            );
          case "lines":
            return (
              <div key={i} className="space-y-3">
                {block.items.map((line) => (
                  <p key={line} className="border-b border-line pb-5">
                    {line}
                  </p>
                ))}
              </div>
            );
        }
      })}
    </>
  );
}

function DocInline({ parts, locale }: { parts: Inline[]; locale: Locale }) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === "string") return part;
        if ("b" in part) return <strong key={i}>{part.b}</strong>;
        if (part.href.startsWith("/")) {
          return (
            <Link key={i} href={localePath(locale, part.href)}>
              {part.a}
            </Link>
          );
        }
        return (
          <a key={i} href={part.href}>
            {part.a}
          </a>
        );
      })}
    </>
  );
}

/** The operator's postal address, as the Impressum and the Widerruf need it. */
export function OperatorAddress({ locale }: { locale: Locale }) {
  return (
    <address className="not-italic text-ink">
      {OPERATOR.name}
      <br />
      {OPERATOR.street}
      <br />
      {OPERATOR.city}
      <br />
      {OPERATOR.country[locale]}
    </address>
  );
}

export function MailLink() {
  return <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>;
}

/** A framed block for text that must stand out, such as the right to object. */
export function Callout({ children }: { children: ReactNode }) {
  return <div className="space-y-3 rounded-xl border border-line bg-base-10 p-4 md:p-5">{children}</div>;
}
