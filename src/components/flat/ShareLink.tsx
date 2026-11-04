"use client";

import { Check, Copy, Download } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n/client";
import type { Flat } from "@/lib/types";

/** The public applicant link. No language prefix: applicants get their language by themselves. */
export function flatUrl(flatId: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://joinpairspace.com");
  return `${base.replace(/\/$/, "")}/w/${flatId}`;
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: "link" | "text", text: string) => {
    await navigator.clipboard.writeText(text);
    track("link_copied", { what: key });
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
  };
  return { copied, copy };
}

/** The applicant link with copy button, QR code and a text block for the listing. */
export function ShareLink({ flat }: { flat: Flat }) {
  const url = flatUrl(flat.id);
  const t = useT();
  const [qr, setQr] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#dadada", light: "#1e1e1e" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [url]);

  const adText = t(
    `Damit die neue WG wirklich zusammenpasst, lernt ihr euch vorab kennen: Trag dich über diesen Link ein, schau dir die anderen Bewerber an und sag, mit wem du dir das Zusammenleben vorstellen kannst. Erst danach laden wir zur Besichtigung ein.\n\n${url}`,
    `So the new flatshare really works, you get to know each other first: sign up through this link, look at the other applicants and say who you could picture living with. Only then do we invite you to a viewing.\n\n${url}`,
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="ui-label">{t("Dein Link", "Your link")}</span>
        <div className="mt-2 flex gap-2">
          <input className="input input-lg font-mono text-ui-small" readOnly value={url} onFocus={(e) => e.target.select()} />
          <button type="button" className="btn btn-cta btn-lg shrink-0" onClick={() => copy("link", url)}>
            {copied === "link" ? <Check size={15} strokeWidth={2} /> : <Copy size={15} strokeWidth={1.75} />}
            {copied === "link" ? t("Kopiert", "Copied") : t("Kopieren", "Copy")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="ui-label">{t("Text für deine Anzeige", "Text for your listing")}</span>
            <button type="button" className="btn btn-ghost h-7 px-2" onClick={() => copy("text", adText)}>
              {copied === "text" ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
              {copied === "text" ? t("Kopiert", "Copied") : t("Kopieren", "Copy")}
            </button>
          </div>
          <p className="mt-2 whitespace-pre-line text-ui-small leading-relaxed text-muted">{adText}</p>
          <p className="mt-3 text-ui-smaller text-faint">
            {t(
              "Passt in die Anzeige bei WG Gesucht, Immoscout oder Kleinanzeigen, oder als Antwort auf jede Anfrage.",
              "Works in your listing on WG Gesucht, Immoscout, Kleinanzeigen or any other site, or as a reply to every enquiry.",
            )}
          </p>
        </div>
        <div className="card flex flex-col items-center justify-center gap-3 p-4">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={t("QR Code zum Bewerberlink", "QR code for the applicant link")} className="h-[140px] w-[140px] rounded-sm" />
          ) : (
            <div className="h-[140px] w-[140px] rounded-sm bg-base-25" />
          )}
          {qr ? (
            <a
              href={qr}
              download={`pairspace-${flat.id}.png`}
              className="btn btn-ghost h-7 px-2"
              onClick={() => track("qr_downloaded")}
            >
              <Download size={13} strokeWidth={1.75} /> {t("QR Code", "QR code")}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
