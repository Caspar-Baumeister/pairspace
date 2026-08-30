"use client";

import { useEffect, useState } from "react";

import { eventUrl } from "@/lib/slug";

export function ShareLink({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(eventUrl(slug));
  }, [slug]);

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
    </div>
  );
}
