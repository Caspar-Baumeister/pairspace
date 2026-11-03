"use client";

import { BedDouble, ChevronDown, FolderClosed, Link2, Search, Settings, Waypoints } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  CAMP_COLOR,
  COLOR_AT,
  FPS,
  FRAMES,
  GROUPS,
  LINKS,
  MATCH_AT,
  PEOPLE,
  SPAWN_END,
  SPAWN_FRAME,
  TRIO,
  indexOf,
  layout,
  nodeRadius,
} from "./heroGraph";

const ACCENT = "#8a6cef";
const STROKE = { size: 16, strokeWidth: 1.75 } as const;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** Overshoot like a spring, so nodes pop. */
const easeOutBack = (t: number) => {
  const c1 = 2.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map((k) => parseInt(b.slice(k, k + 2), 16));
  return `rgb(${pa.map((v, k) => Math.round(v + (pb[k] - v) * t)).join(",")})`;
}

/** Plays the precomputed layout at 30 fps once, after a short pause for the headline. */
function usePlayback(delayMs: number) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFrame(FRAMES - 1);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t + delayMs;
      const f = Math.max(0, Math.min(FRAMES - 1, Math.floor(((t - start) / 1000) * FPS)));
      setFrame(f);
      if (f < FRAMES - 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [delayMs]);
  return frame;
}

/** Bounding box of the settled graph, the camera ends there. */
function finalBox(xs: Float32Array[], ys: Float32Array[]) {
  const x = xs[FRAMES - 1];
  const y = ys[FRAMES - 1];
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < x.length; i++) {
    const r = nodeRadius(i) + 8;
    x0 = Math.min(x0, x[i] - r);
    x1 = Math.max(x1, x[i] + r);
    y0 = Math.min(y0, y[i] - r);
    y1 = Math.max(y1, y[i] + r + 14);
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0 + 40, h: y1 - y0 + 40 };
}

const NEIGHBORS = (() => {
  const map = PEOPLE.map(() => new Set<number>());
  for (const l of LINKS) {
    if (l.s < 0.45) continue;
    map[l.a].add(l.b);
    map[l.b].add(l.a);
  }
  return map;
})();

/**
 * The hero: the landlord app in a window, applicants popping into the graph
 * one by one like in the promo video, then the best group lights up.
 */
export function HeroWindow() {
  const frame = usePlayback(700);
  const spawned = PEOPLE.filter((_, i) => SPAWN_FRAME[i] <= frame).length;
  const ratings = Math.round(spawned * Math.max(0, spawned - 1) * 0.54);
  const match = easeOut(clamp01((frame - MATCH_AT) / 22));

  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-bg shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
      {/* Title bar with one tab */}
      <div className="flex h-10 items-center gap-3 border-b border-line bg-bg-2 px-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((k) => (
            <span key={k} className="h-3 w-3 rounded-full bg-base-35" />
          ))}
        </div>
        <div className="ml-2 flex h-full items-end">
          <div className="flex h-8 items-center gap-2 rounded-t-md border border-b-0 border-line bg-bg px-3 text-ui-small text-ink">
            <Waypoints size={14} strokeWidth={1.75} className="text-muted" />
            Bewerber
            <span className="hidden text-faint sm:inline">· 3er WG Weserstraße</span>
          </div>
        </div>
      </div>

      <div className="flex h-[380px] sm:h-[460px] lg:h-[540px]">
        {/* Ribbon */}
        <div className="hidden w-11 flex-col items-center gap-1 border-r border-line bg-bg-2 py-2 md:flex">
          {[Waypoints, BedDouble, Link2, Search].map((Icon, k) => (
            <span key={k} className={`flex h-8 w-8 items-center justify-center rounded-md ${k === 0 ? "bg-[var(--hover)] text-ink" : "text-faint"}`}>
              <Icon {...STROKE} />
            </span>
          ))}
        </div>

        {/* Sidebar: more than one flat, all in one account */}
        <div className="hidden w-[220px] shrink-0 border-r border-line bg-bg-2 px-2 py-3 text-ui-small md:block">
          <div className="ui-label px-2 pb-2">Wohnungen</div>
          <div className="flex items-center gap-1.5 rounded px-2 py-1 text-ink">
            <ChevronDown size={14} strokeWidth={1.75} className="text-faint" />
            3er WG Weserstraße
          </div>
          {[
            { icon: Waypoints, label: "Bewerber", active: true },
            { icon: BedDouble, label: "Zimmer" },
            { icon: Link2, label: "Einladungslink" },
            { icon: Settings, label: "Einstellungen" },
          ].map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={`ml-4 flex items-center gap-2 rounded px-2 py-1 ${active ? "bg-[var(--hover)] text-ink" : "text-muted"}`}
            >
              <Icon size={14} strokeWidth={1.75} className={active ? "text-accent" : "text-faint"} />
              {label}
            </div>
          ))}
          {["4er WG Sonnenallee", "2er WG Graefekiez", "5er WG Schillerkiez"].map((t) => (
            <div key={t} className="mt-0.5 flex items-center gap-1.5 rounded px-2 py-1 text-muted">
              <FolderClosed size={14} strokeWidth={1.75} className="text-faint" />
              {t}
            </div>
          ))}
        </div>

        {/* Graph */}
        <div className="relative min-w-0 flex-1">
          <Graph frame={frame} match={match} />
          <div className="pointer-events-none absolute bottom-2 right-3 text-ui-smaller tabular-nums text-faint">
            {spawned} Bewerber · 3 Zimmer · {ratings.toLocaleString("de-DE")} Bewertungen
          </div>
          {/* On small screens the best group floats over the graph */}
          <div
            className="absolute bottom-8 left-3 right-3 lg:hidden"
            style={{ opacity: match, transform: `translateY(${(1 - match) * 16}px)` }}
          >
            <GroupCard rank={1} group={GROUPS[0]} selected compact />
          </div>
        </div>

        {/* Best groups */}
        <div className="hidden w-[300px] shrink-0 border-l border-line bg-bg-2 lg:flex lg:flex-col">
          <div className="flex gap-1 border-b border-line p-2 text-ui-small">
            <span className="rounded bg-[var(--hover)] px-2 py-1 text-ink">Beste Gruppen</span>
            <span className="px-2 py-1 text-faint">Alle</span>
            <span className="px-2 py-1 text-faint">Person</span>
          </div>
          <div className="flex-1 overflow-hidden p-3">
            <div className="text-ui-medium font-semibold text-ink">Beste 3er Gruppen</div>
            {frame < MATCH_AT ? (
              <div className="mt-4 space-y-3 text-ui-small">
                <Stat label="Bewerber" value={String(spawned)} />
                <Stat label="Bewertungen" value={ratings.toLocaleString("de-DE")} />
                <p className="pt-1 text-faint">Bewertungen laufen ein, die Gruppen rechnen sich laufend neu.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {GROUPS.map((g, k) => {
                  const t = easeOut(clamp01((frame - MATCH_AT - k * 6) / 14));
                  return (
                    <div key={k} style={{ opacity: t, transform: `translateY(${(1 - t) * 14}px)` }}>
                      <GroupCard rank={k + 1} group={g} selected={k === 0} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line pb-2">
      <span className="text-faint">{label}</span>
      <span className="text-[22px] font-bold tabular-nums text-ink">{value}</span>
    </div>
  );
}

/* ----------------------------------------------------------------- graph */

function Graph({ frame, match }: { frame: number; match: number }) {
  const { xs, ys } = useMemo(() => layout(), []);
  const box = useMemo(() => finalBox(xs, ys), [xs, ys]);
  const [hover, setHover] = useState<number | null>(null);
  // Start close on the first arrivals and pull back while the graph fills up, like the video.
  const t = clamp01(frame / SPAWN_END);
  const zoom = 1 + 0.55 * (1 - (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2));
  const vw = box.w / zoom;
  const vh = box.h / zoom;
  const viewBox = [box.cx - vw / 2, box.cy - vh / 2, vw, vh].join(" ");
  const x = xs[frame];
  const y = ys[frame];
  const color = clamp01((frame - COLOR_AT) / 30);
  const trio = new Set(TRIO);
  const focus = hover !== null ? new Set([hover, ...NEIGHBORS[hover]]) : null;
  const order = PEOPLE.map((_, i) => i).sort((a, b) => Number(trio.has(a)) - Number(trio.has(b)));

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label="Graph mit 48 Bewerbern in vier Gruppen, die beste Dreiergruppe ist hervorgehoben"
    >
      <defs>
        {PEOPLE.map((p, i) =>
          p.face ? (
            <clipPath key={p.id} id={`hero-clip-${i}`}>
              <circle r={nodeRadius(i)} />
            </clipPath>
          ) : null,
        )}
      </defs>

      {LINKS.map((l, k) => {
        if (SPAWN_FRAME[l.a] > frame || SPAWN_FRAME[l.b] > frame) return null;
        const born = Math.max(SPAWN_FRAME[l.a], SPAWN_FRAME[l.b]);
        const fade = clamp01((frame - born) / 10);
        const inTrio = trio.has(l.a) && trio.has(l.b);
        const lit = focus ? focus.has(l.a) && focus.has(l.b) && (l.a === hover || l.b === hover) : false;
        let stroke = `rgba(218,218,218,${(0.1 + 0.3 * l.s) * fade * (focus ? 0.35 : 1 - 0.55 * match)})`;
        let width = 0.8 + 1.6 * l.s;
        if (inTrio && !focus) {
          stroke = match > 0 ? ACCENT : `rgba(218,218,218,${0.45 * fade})`;
          width = 1.8 + 1.6 * match;
        }
        if (lit) {
          stroke = ACCENT;
          width = 1.2 + 1.8 * l.s;
        }
        return <line key={k} x1={x[l.a]} y1={y[l.a]} x2={x[l.b]} y2={y[l.b]} stroke={stroke} strokeWidth={width} strokeLinecap="round" />;
      })}

      {order.map((i) => {
        const p = PEOPLE[i];
        const born = SPAWN_FRAME[i];
        if (born > frame) return null;
        const age = frame - born;
        const r = nodeRadius(i);
        const pop = easeOutBack(clamp01(age / 11));
        const flash = clamp01(age / 16);
        const isTrio = trio.has(i);
        const camp = mix("#4a4a4a", CAMP_COLOR[p.camp], color);
        const ring = focus?.has(i) && hover === i ? ACCENT : isTrio && match > 0 && !focus ? mix(CAMP_COLOR[p.camp], ACCENT, match) : camp;
        const dim = focus ? (focus.has(i) ? 1 : 0.22) : isTrio ? 1 : 1 - 0.5 * match;
        const showName = (focus?.has(i) ?? false) || (isTrio && match > 0.6 && !focus);
        return (
          <g
            key={p.id}
            transform={`translate(${x[i]} ${y[i]})`}
            opacity={dim}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            style={{ cursor: "pointer" }}
          >
            {age < 16 ? <circle r={r * (1 + flash * 1.1)} fill="none" stroke={ACCENT} strokeWidth={1.5} opacity={0.8 * (1 - flash)} /> : null}
            {isTrio && match > 0 && !focus ? <circle r={r + 7} fill={`rgba(138,108,239,${0.22 * match})`} /> : null}
            <g transform={`scale(${pop})`}>
              {p.face ? (
                <>
                  <circle r={r} fill="#2a2a2a" />
                  <image
                    href={`/faces/${p.face}.webp`}
                    x={-r}
                    y={-r}
                    width={2 * r}
                    height={2 * r}
                    clipPath={`url(#hero-clip-${i})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </>
              ) : (
                <>
                  <circle r={r} fill={mix("#2a2a2a", CAMP_COLOR[p.camp], 0.22)} />
                  <text textAnchor="middle" dy="0.35em" fontSize={r * 0.95} fontWeight={700} fill={CAMP_COLOR[p.camp]}>
                    {p.name[0]}
                  </text>
                </>
              )}
              <circle r={r} fill="none" stroke={ring} strokeWidth={isTrio && match > 0 ? 2.6 : 2} />
            </g>
            {showName ? (
              <text y={r + 13} textAnchor="middle" fontSize={11} fontWeight={600} fill="#dadada">
                {p.name}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------ group card */

function GroupCard({
  rank,
  group,
  selected,
  compact = false,
}: {
  rank: number;
  group: (typeof GROUPS)[number];
  selected?: boolean;
  compact?: boolean;
}) {
  const meters: [string, number, string][] = [
    ["Harmonie", rank === 1 ? 92 : rank === 2 ? 86 : 82, ""],
    ["Zimmer", rank === 3 ? 83 : 100, ""],
    ["Bewertet", rank === 3 ? 83 : 100, rank === 3 ? "5 von 6" : "6 von 6"],
  ];
  return (
    <div className={`card p-3 ${selected ? "border-accent-line bg-[#2b2540]" : ""}`}>
      <div className="flex items-center gap-2.5">
        <span className="w-5 text-ui-smaller tabular-nums text-faint">#{rank}</span>
        <div className="flex -space-x-2">
          {group.ids.map((id) => {
            const p = PEOPLE[indexOf(id)];
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={id}
                src={`/faces/${p.face}.webp`}
                alt={p.name}
                className="h-7 w-7 rounded-full object-cover ring-2 ring-bg-2"
              />
            );
          })}
        </div>
        <div className="flex-1" />
        <div className="text-right">
          <div className="text-[20px] font-bold leading-none tabular-nums text-ink">{group.score}</div>
          <div className="text-[9px] uppercase tracking-wide text-faint">Punkte</div>
        </div>
      </div>
      <div className="mt-1.5 truncate text-ui-small text-muted">
        {group.ids.map((id) => PEOPLE[indexOf(id)].name).join(", ")}
      </div>
      {compact ? null : (
        <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
          {meters.map(([label, value, display], k) => (
            <div key={label}>
              <div className="flex justify-between gap-1.5 text-[10px] text-faint">
                <span className="truncate">{label}</span>
                <span className="shrink-0 tabular-nums">{display || value}</span>
              </div>
              <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-base-30">
                <div className={`h-full rounded-full ${k === 2 ? "bg-base-60" : "bg-accent"}`} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
