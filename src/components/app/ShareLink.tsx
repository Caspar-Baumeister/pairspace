"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { eventUrl } from "@/lib/slug";

export function ShareLink({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState("");
  const [showQr, setShowQr] = useState(!compact);

  useEffect(() => {
    setUrl(eventUrl(slug));
  }, [slug]);

  useEffect(() => {
    if (!url) return;
    let live = true;
    // High resolution so the same image works on screen and on a printed flyer.
    QRCode.toDataURL(url, {
      width: 640,
      margin: 2,
      color: { dark: "#221418", light: "#ffffff" },
    }).then((dataUrl) => {
      if (live) setQr(dataUrl);
    });
    return () => {
      live = false;
    };
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const message = `Find a partner for our event: ${url}`;

  return (
    <div className={compact ? "" : "rounded-xl border border-line bg-surface p-5"}>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-sunken px-3.5 py-3">
        <span className="truncate text-[0.875rem] text-ink">{url || "Preparing your link"}</span>
        <button type="button" className="btn btn-primary btn-sm ml-auto shrink-0" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {!compact ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a
            className="btn btn-secondary btn-sm"
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
          <a
            className="btn btn-secondary btn-sm"
            href={`mailto:?subject=${encodeURIComponent("Find a partner for our event")}&body=${encodeURIComponent(message)}`}
          >
            Email
          </a>
          <a className="btn btn-secondary btn-sm" href={url} target="_blank" rel="noreferrer">
            Open
          </a>
        </div>
      ) : null}

      {compact && !showQr ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm mt-3"
          onClick={() => setShowQr(true)}
        >
          <QrGlyph />
          Show QR code
        </button>
      ) : null}

      {showQr ? (
        <div className="mt-4 flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt={`QR code for ${url}`}
              width={112}
              height={112}
              className="h-28 w-28 shrink-0 rounded-lg border border-line bg-white"
            />
          ) : (
            <div className="h-28 w-28 shrink-0 animate-pulse rounded-lg bg-sunken" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="text-[0.9375rem] font-medium text-ink">QR code for your event</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-muted">
              Put it on a poster or the check in desk. Scanning opens your event link.
            </p>
            <a
              className="btn btn-secondary btn-sm mt-3"
              href={qr || undefined}
              download={`pairspace-${slug}-qr.png`}
              aria-disabled={!qr}
            >
              Download PNG
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QrGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 8h2v2H8zM11 11h2v2h-2z"
        fill="currentColor"
      />
    </svg>
  );
}
