"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

const LANGS: { id: Locale; label: string }[] = [
  { id: "de", label: "Deutsch" },
  { id: "en", label: "English" },
];

const MARKS = [25, 50, 75] as const;

/**
 * The 30 second promo in both languages, starting in the page language. It
 * has no sound, so it plays muted while it is on screen and pauses when you
 * scroll past. Click to pause.
 *
 * Analytics, once per language and page view: video_started, video_progress
 * at 25, 50 and 75 percent, video_completed at the end of the first run.
 * video_paused only when someone pauses it by hand.
 */
export function PromoVideo() {
  const t = useT();
  const pageLocale = useLocale();
  const [lang, setLang] = useState<Locale>(pageLocale);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const seen = useRef(new Set<string>());

  // The site language switch also switches the video.
  useEffect(() => setLang(pageLocale), [pageLocale]);

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

  const once = (key: string, event: string, props: Record<string, string | number>) => {
    if (seen.current.has(key)) return;
    seen.current.add(key);
    track(event, props);
  };

  const onTime = () => {
    const video = ref.current;
    if (!video || !video.duration) return;
    const percent = (video.currentTime / video.duration) * 100;
    for (const mark of MARKS) {
      if (percent >= mark) once(`${lang}:${mark}`, "video_progress", { lang, percent: mark });
    }
    // A looping video never fires "ended", the jump back to the start marks the end of a run.
    if (percent >= 97) once(`${lang}:done`, "video_completed", { lang });
  };

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else {
      video.pause();
      track("video_paused", { lang, seconds: Math.round(video.currentTime) });
    }
  };

  const pick = (next: Locale) => {
    if (next === lang) return;
    track("video_language_changed", { lang: next });
    setLang(next);
  };

  return (
    <div>
      <div className="mb-4 flex justify-center">
        <div
          className="inline-flex rounded-lg border border-line bg-bg-2 p-1 text-ui-small"
          role="group"
          aria-label={t("Sprache des Videos", "Video language")}
        >
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              lang={l.id}
              aria-pressed={lang === l.id}
              onClick={() => pick(l.id)}
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
          onPlay={() => {
            setPlaying(true);
            once(`${lang}:start`, "video_started", { lang });
          }}
          onPause={() => setPlaying(false)}
          onTimeUpdate={onTime}
          onClick={toggle}
          className="block aspect-video w-full cursor-pointer"
          aria-label={lang === "de" ? "Pairspace Video auf Deutsch" : "Pairspace video in English"}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t("Video pausieren", "Pause video") : t("Video abspielen", "Play video")}
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
