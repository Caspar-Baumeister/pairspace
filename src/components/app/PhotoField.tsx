"use client";

import { useEffect, useRef, useState } from "react";

import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { PhotoError, localPreview, preparePhoto } from "@/lib/firebase/storage";

export interface PhotoSelection {
  /** The prepared square image, ready to upload. Null means no change. */
  blob: Blob | null;
  /** Object URL for the preview, or the already uploaded URL. */
  preview: string | null;
  /** True when the participant asked to remove an existing photo. */
  removed: boolean;
}

export function PhotoField({
  name,
  seed,
  currentUrl,
  required,
  onChange,
}: {
  name: string;
  seed: string;
  currentUrl?: string | null;
  required?: boolean;
  onChange: (selection: PhotoSelection) => void;
}) {
  const input = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const objectUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setWorking(true);
    try {
      const blob = await preparePhoto(file);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      const url = localPreview(new File([blob], "photo.webp", { type: "image/webp" }));
      objectUrl.current = url;
      setPreview(url);
      onChange({ blob, preview: url, removed: false });
    } catch (e) {
      setError(e instanceof PhotoError ? e.message : "Could not read that image.");
    } finally {
      setWorking(false);
    }
  }

  function clear() {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    setPreview(null);
    onChange({ blob: null, preview: null, removed: true });
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <p className="label">
        Your photo
        {required ? <span className="ml-1 text-accent">required</span> : <span className="ml-1 text-ink-faint">optional</span>}
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={preview ? "Replace photo" : "Upload a photo"}
          className="relative shrink-0 cursor-pointer transition-transform hover:scale-[1.03]"
          onClick={() => input.current?.click()}
          disabled={working}
        >
          <PersonAvatar name={name || "You"} seed={seed} photoUrl={preview} size={80} />
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-(--shadow-accent) outline-3 outline-surface"
            style={{ background: "var(--gradient-accent)" }}
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => input.current?.click()}
            disabled={working}
          >
            {working ? "Reading" : preview ? "Replace photo" : "Upload a photo"}
          </button>
          {preview ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
              Remove
            </button>
          ) : null}
        </div>

        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
      </div>

      <p className="mt-2 text-[0.8125rem] text-ink-faint">
        {preview
          ? "Cropped to a square and shrunk in your browser before it is uploaded."
          : "Without a photo you get the illustrated portrait above. It stays the same for you at this event."}
      </p>
      {error ? <p className="mt-2 text-[0.8125rem] text-danger">{error}</p> : null}
    </div>
  );
}
