"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Lang = "de" | "en";

const LANGS: { id: Lang; label: string }[] = [
  { id: "de", label: "Deutsch" },
  { id: "en", label: "English" },
];

/**
 * The 30 second promo in both languages. It has no sound, so it plays muted
 * while it is on screen and pauses when you scroll past. Click to pause.
 */
export function PromoVideo() {
  const [lang, setLang] = useState<Lang>("de");
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.3 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [lang]);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  return (
    <div>
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-lg border border-line bg-bg-2 p-1 text-ui-small" role="group" aria-label="Sprache des Videos">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={lang === l.id}
              onClick={() => setLang(l.id)}
              className={`rounded-md px-3 py-1.5 transition-colors ${lang === l.id ? "bg-[var(--hover)] text-ink" : "text-faint hover:text-muted"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div className="group relative overflow-hidden rounded-xl border border-line-strong bg-black shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
        <video
          key={lang}
          ref={ref}
          src={`/video/pairspace-${lang}.mp4`}
          poster={`/video/poster-${lang}.jpg`}
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={toggle}
          className="block aspect-video w-full cursor-pointer"
          aria-label={lang === "de" ? "Pairspace Video auf Deutsch" : "Pairspace video in English"}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Video pausieren" : "Video abspielen"}
          className={`absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-opacity ${
            playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        >
          {playing ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}
