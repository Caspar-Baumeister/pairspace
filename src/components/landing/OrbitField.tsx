"use client";

import type { CSSProperties } from "react";

import { Avatar, type PersonMark } from "./Avatar";

interface Placed extends PersonMark {
  /** Ring radius in px, one of the orbits drawn below. */
  r: number;
  /** Position on the ring in degrees. 0 is to the right, 90 is straight down. */
  angle: number;
  size: number;
  /** Seconds, offsets the drift so the cast never moves in lockstep. */
  delay: number;
  /** The outer ring only fits on very wide screens. */
  wide?: boolean;
}

/**
 * Everyone sits on a drawn ring, well outside the headline column, and drifts a
 * few degrees back and forth along that ring.
 */
const PEOPLE: Placed[] = [
  { name: "Lena Weber", seed: "lena-weber", role: "Flyer", r: 610, angle: -150, size: 64, delay: 0 },
  { name: "Leo Fischer", seed: "leo-fischer", role: "Base", r: 470, angle: 172, size: 58, delay: 3.2 },
  { name: "Ana Ribeiro", seed: "ana-ribeiro", role: "Follower", r: 610, angle: 150, size: 54, delay: 6.1 },
  { name: "Tomas Nowak", seed: "tomas-nowak", role: "Leader", r: 750, angle: -163, size: 56, delay: 9.4, wide: true },
  { name: "Sara Lindqvist", seed: "sara-lindqvist", role: "Flyer", r: 610, angle: -30, size: 64, delay: 1.7 },
  { name: "Luca Moretti", seed: "luca-moretti", role: "Base", r: 470, angle: 8, size: 58, delay: 4.8 },
  { name: "Emma Nielsen", seed: "emma-nielsen", role: "Both", r: 610, angle: 30, size: 54, delay: 7.5 },
  { name: "Nora Castillo", seed: "nora-castillo", role: "Leader", r: 750, angle: -17, size: 56, delay: 11.2, wide: true },
];

/** Where the rings meet, relative to the field: the SVG is 1180px tall and shifted up by 46%. */
const CENTER_OFFSET_Y = 520 - 1180 * 0.46;

/**
 * The concentric orbit background that carries the whole page.
 * Rings are pure SVG so they stay crisp, avatars ride on the rings with a slow drift.
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
              <stop offset="100%" stopColor="#FAF5F2" stopOpacity="1" />
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
            stroke="#0D8A5E"
            strokeOpacity="0.28"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M170 520 A610 610 0 0 1 402 44"
            stroke="#0D8A5E"
            strokeOpacity="0.18"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M1390 520 A610 610 0 0 1 1120 1006"
            stroke="#0D8A5E"
            strokeOpacity="0.14"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <rect width="1560" height="1180" fill="url(#orbit-fade)" />
        </svg>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-0 w-0"
        style={{ marginTop: CENTER_OFFSET_Y }}
      >
        {PEOPLE.map((p) => (
          <div
            key={p.name}
            className={`orbit-rider absolute left-0 top-0 ${p.wide ? "hidden 2xl:block" : "hidden xl:block"}`}
            style={
              {
                "--orbit-angle": `${p.angle}deg`,
                "--orbit-r": `${p.r}px`,
                animationDuration: `${14 + (p.delay % 5)}s`,
                animationDelay: `${-p.delay}s`,
              } as CSSProperties
            }
          >
            <div
              style={{
                animation: `float-soft ${9 + (p.delay % 3)}s var(--ease-out-quint) ${-p.delay}s infinite`,
              }}
            >
              <Avatar person={p} size={p.size} />
            </div>
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}
