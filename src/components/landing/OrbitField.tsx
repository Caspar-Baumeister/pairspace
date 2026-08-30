"use client";

import { Avatar, type PersonMark } from "./Avatar";

interface Placed extends PersonMark {
  /** Horizontal position in percent of the field width. */
  x: number;
  /** Vertical position in percent of the field height. */
  y: number;
  size: number;
  delay: number;
  /** Hidden on small screens to keep the hero calm. */
  compact?: boolean;
}

const PEOPLE: Placed[] = [
  { name: "Maya Okonkwo", role: "Flyer", x: 8, y: 22, size: 62, delay: 0, compact: true },
  { name: "Leo Fischer", role: "Base", x: 20, y: 54, size: 56, delay: 1.4 },
  { name: "Ana Ribeiro", role: "Follower", x: 6, y: 68, size: 52, delay: 2.6 },
  { name: "Tomas Nowak", role: "Leader", x: 24, y: 12, size: 54, delay: 3.4 },
  { name: "Sara Lindqvist", role: "Flyer", x: 88, y: 24, size: 62, delay: 0.8, compact: true },
  { name: "Ibrahim Haddad", role: "Base", x: 78, y: 56, size: 56, delay: 2.1 },
  { name: "Yuki Tanaka", role: "Both", x: 92, y: 66, size: 52, delay: 3.1 },
  { name: "Nora Castillo", role: "Leader", x: 73, y: 13, size: 54, delay: 1.7 },
];

/**
 * The concentric orbit background that carries the whole page.
 * Rings are pure SVG so they stay crisp, avatars ride on top with a slow drift.
 */
export function OrbitField({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[1180px] w-[1560px] -translate-x-1/2 -translate-y-[46%]"
      >
        <svg viewBox="0 0 1560 1180" fill="none" className="h-full w-full">
          <defs>
            <radialGradient id="orbit-fade" cx="50%" cy="45%" r="52%">
              <stop offset="55%" stopColor="#fff" stopOpacity="0" />
              <stop offset="100%" stopColor="#F7F7F8" stopOpacity="1" />
            </radialGradient>
          </defs>
          {[190, 330, 470, 610, 750].map((r, i) => (
            <circle
              key={r}
              cx="780"
              cy="520"
              r={r}
              stroke="var(--color-line)"
              strokeWidth={i === 0 ? 1.2 : 1}
            />
          ))}
          {/* One accent arc per second ring, the detail that makes the field feel drawn. */}
          <path
            d="M780 190 A330 330 0 0 1 1074 371"
            stroke="#2B4EF0"
            strokeOpacity="0.28"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M170 520 A610 610 0 0 1 402 44"
            stroke="#2B4EF0"
            strokeOpacity="0.18"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M1390 520 A610 610 0 0 1 1120 1006"
            stroke="#2B4EF0"
            strokeOpacity="0.14"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <rect width="1560" height="1180" fill="url(#orbit-fade)" />
        </svg>
      </div>

      {PEOPLE.map((p) => (
        <div
          key={p.name}
          className={`pointer-events-none absolute -z-10 ${p.compact ? "hidden sm:block" : "hidden xl:block"}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: "translate(-50%, -50%)",
            animation: `float-soft ${9 + (p.delay % 3)}s var(--ease-out-quint) ${p.delay}s infinite`,
          }}
        >
          <Avatar person={p} size={p.size} />
        </div>
      ))}

      {children}
    </div>
  );
}
