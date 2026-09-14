/**
 * Pairspace mascots: two sea otters, Kai and Mo.
 *
 * Sea otters hold paws while they sleep so they do not drift apart. That is
 * the whole product in one animal. Kai is the base, a little broader, teal
 * headband. Mo is the flyer, a little smaller, coral wristbands.
 *
 * Everything here is plain SVG drawn in a 200 x 200 box per otter and composed
 * into scenes. Motion is CSS only, defined in globals.css under "Mascot motion",
 * and every animation is switched off by prefers-reduced-motion.
 */

export type Who = "kai" | "mo";
export type Eyes = "open" | "happy" | "closed" | "wide" | "wink" | "up";
export type Mouth = "smile" | "open" | "o" | "flat" | "grin";

export interface OtterProps {
  who?: Who;
  eyes?: Eyes;
  mouth?: Mouth;
  /** Rotation of the right arm in degrees. 0 points sideways, negative lifts it. */
  armR?: number;
  /** Rotation of the left arm. Mirrored, so the same value gives a symmetric pose. */
  armL?: number;
  /** Extra class on the outer group, used to attach motion. */
  className?: string;
  /** Class for the right arm group, for a waving animation. */
  armRClass?: string;
  armLClass?: string;
  /** Straight part of the arm. 30 is the resting default, the lift pose reaches with 90. */
  armLength?: number;
  /** Show a small sweat drop next to the head. */
  sweat?: boolean;
  /** Pupils look this way, in units of the eye radius. */
  look?: { x: number; y: number };
  transform?: string;
}

export const PALETTE = {
  ink: "#1E2A38",
  furKai: "#C98A5B",
  furMo: "#D9A470",
  belly: "#F6E3CB",
  cheek: "#FF9F8E",
  teal: "#12B4C6",
  tealDark: "#0B8794",
  coral: "#FF6F59",
  coralDark: "#D9553F",
  sun: "#FFC532",
  white: "#FFFFFF",
};

const SW = 5; // outline width in the 200 box

function Arm({
  side,
  angle,
  who,
  className,
  length = 30,
}: {
  side: "L" | "R";
  angle: number;
  who: Who;
  className?: string;
  length?: number;
}) {
  const fur = who === "kai" ? PALETTE.furKai : PALETTE.furMo;
  const shoulder = side === "R" ? "translate(136 118)" : "translate(64 118) scale(-1 1)";
  return (
    <g transform={shoulder}>
      <g className={className} style={{ transformOrigin: "0px 0px" }}>
        <g transform={`rotate(${angle})`}>
          {/* upper arm to paw */}
          <path
            d={`M 0 -10 L ${length} -10 A 12 12 0 0 1 ${length} 12 L 0 12 Z`}
            fill={fur}
            stroke={PALETTE.ink}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          {who === "mo" ? (
            <rect x={length - 12} y="-11" width="9" height="24" rx="3" fill={PALETTE.coral} stroke={PALETTE.ink} strokeWidth={3} />
          ) : null}
          <circle cx={length + 4} cy="1" r="10" fill={PALETTE.belly} stroke={PALETTE.ink} strokeWidth={SW} />
        </g>
      </g>
    </g>
  );
}

function Eye({ x, y, state, look, wink }: { x: number; y: number; state: Eyes; look: { x: number; y: number }; wink?: boolean }) {
  if (state === "happy" || wink) {
    return (
      <path
        d={`M ${x - 8} ${y + 2} Q ${x} ${y - 8} ${x + 8} ${y + 2}`}
        fill="none"
        stroke={PALETTE.ink}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
    );
  }
  if (state === "closed") {
    return (
      <path
        d={`M ${x - 8} ${y} Q ${x} ${y + 6} ${x + 8} ${y}`}
        fill="none"
        stroke={PALETTE.ink}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
    );
  }
  const r = state === "wide" ? 8 : 6.5;
  const dx = look.x * 2.5;
  const dy = (state === "up" ? -2.5 : 0) + look.y * 2.5;
  return (
    <g className="otter-blink" style={{ transformOrigin: `${x}px ${y}px` }}>
      <circle cx={x + dx} cy={y + dy} r={r} fill={PALETTE.ink} />
      <circle cx={x + dx + 2.2} cy={y + dy - 2.2} r={2.2} fill={PALETTE.white} />
    </g>
  );
}

function MouthShape({ state }: { state: Mouth }) {
  const y = 100;
  switch (state) {
    case "open":
      return (
        <g>
          <path d={`M 90 ${y} Q 100 ${y + 14} 110 ${y} Z`} fill={PALETTE.ink} />
          <path d={`M 95 ${y + 6} Q 100 ${y + 11} 105 ${y + 6} Z`} fill={PALETTE.coral} />
        </g>
      );
    case "grin":
      return (
        <path d={`M 88 ${y - 2} Q 100 ${y + 12} 112 ${y - 2}`} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={4} strokeLinejoin="round" />
      );
    case "o":
      return <circle cx="100" cy={y + 3} r="4.5" fill={PALETTE.ink} />;
    case "flat":
      return <path d={`M 93 ${y + 2} L 107 ${y + 2}`} stroke={PALETTE.ink} strokeWidth={4} strokeLinecap="round" />;
    default:
      return (
        <path d={`M 91 ${y} Q 100 ${y + 8} 109 ${y}`} fill="none" stroke={PALETTE.ink} strokeWidth={4} strokeLinecap="round" />
      );
  }
}

/**
 * One otter, front facing, standing, drawn in a 200 x 200 box. Feet touch y = 196.
 */
export function Otter({
  who = "kai",
  eyes = "open",
  mouth = "smile",
  armR = 35,
  armL = 35,
  className,
  armRClass,
  armLClass,
  sweat = false,
  look = { x: 0, y: 0 },
  transform,
  armLength = 30,
}: OtterProps) {
  const fur = who === "kai" ? PALETTE.furKai : PALETTE.furMo;
  return (
    <g className={className} transform={transform}>
      {/* tail, peeks out behind on the left */}
      <path
        d="M 66 150 C 40 160, 30 178, 46 190 C 54 194, 62 184, 68 172 Z"
        fill={fur}
        stroke={PALETTE.ink}
        strokeWidth={SW}
        strokeLinejoin="round"
      />

      {/* feet */}
      <ellipse cx="82" cy="188" rx="17" ry="9" fill={PALETTE.belly} stroke={PALETTE.ink} strokeWidth={SW} />
      <ellipse cx="118" cy="188" rx="17" ry="9" fill={PALETTE.belly} stroke={PALETTE.ink} strokeWidth={SW} />

      {/* arms sit behind the body */}
      <Arm side="L" angle={armL} who={who} className={armLClass} length={armLength} />
      <Arm side="R" angle={armR} who={who} className={armRClass} length={armLength} />

      {/* body */}
      <path
        d="M 100 96 C 138 96, 152 124, 152 150 C 152 176, 130 190, 100 190 C 70 190, 48 176, 48 150 C 48 124, 62 96, 100 96 Z"
        fill={fur}
        stroke={PALETTE.ink}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M 100 112 C 122 112, 132 132, 132 152 C 132 170, 118 180, 100 180 C 82 180, 68 170, 68 152 C 68 132, 78 112, 100 112 Z"
        fill={PALETTE.belly}
      />

      {/* ears */}
      <circle cx="61" cy="52" r="11" fill={fur} stroke={PALETTE.ink} strokeWidth={SW} />
      <circle cx="139" cy="52" r="11" fill={fur} stroke={PALETTE.ink} strokeWidth={SW} />
      <circle cx="61" cy="52" r="4.5" fill={PALETTE.belly} />
      <circle cx="139" cy="52" r="4.5" fill={PALETTE.belly} />

      {/* head */}
      <circle cx="100" cy="72" r="46" fill={fur} stroke={PALETTE.ink} strokeWidth={SW} />

      {/* headband for Kai, a tuft for Mo */}
      {who === "kai" ? (
        <g>
          <path
            d="M 56 50 Q 100 34 144 50 L 144 62 Q 100 48 56 62 Z"
            fill={PALETTE.teal}
            stroke={PALETTE.ink}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          <path d="M 144 54 L 160 44 L 158 58 Z" fill={PALETTE.teal} stroke={PALETTE.ink} strokeWidth={4} strokeLinejoin="round" />
        </g>
      ) : (
        <path
          d="M 92 30 C 96 18, 104 18, 108 30 M 100 28 C 100 20, 110 16, 116 24"
          fill="none"
          stroke={PALETTE.ink}
          strokeWidth={4.5}
          strokeLinecap="round"
        />
      )}

      {/* muzzle */}
      <ellipse cx="100" cy="92" rx="26" ry="18" fill={PALETTE.belly} />
      <ellipse cx="100" cy="84" rx="7.5" ry="5.5" fill={PALETTE.ink} />
      <circle cx="97.5" cy="82.5" r="1.8" fill={PALETTE.white} />
      <MouthShape state={mouth} />

      {/* whisker dots */}
      <circle cx="78" cy="92" r="1.8" fill={PALETTE.ink} />
      <circle cx="74" cy="98" r="1.8" fill={PALETTE.ink} />
      <circle cx="122" cy="92" r="1.8" fill={PALETTE.ink} />
      <circle cx="126" cy="98" r="1.8" fill={PALETTE.ink} />

      {/* cheeks */}
      <circle cx="70" cy="86" r="7" fill={PALETTE.cheek} opacity="0.55" />
      <circle cx="130" cy="86" r="7" fill={PALETTE.cheek} opacity="0.55" />

      {/* eyes */}
      <Eye x={82} y={70} state={eyes} look={look} />
      <Eye x={118} y={70} state={eyes} look={look} wink={eyes === "wink"} />

      {sweat ? (
        <path
          d="M 150 60 C 150 52, 156 46, 156 46 C 156 46, 162 52, 162 60 A 6 6 0 0 1 150 60 Z"
          fill="#7CD3F5"
          stroke={PALETTE.ink}
          strokeWidth={3.5}
          strokeLinejoin="round"
          className="otter-drip"
          style={{ transformOrigin: "156px 46px" }}
        />
      ) : null}
    </g>
  );
}

/* Small props ------------------------------------------------------------- */

export function Ground({ cx = 100, cy = 194, rx = 54 }: { cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={7} fill={PALETTE.ink} opacity="0.08" />;
}

export function Sparkle({ x, y, s = 1, className }: { x: number; y: number; s?: number; className?: string }) {
  /* Position and size live on wrapper groups so a CSS transform animation on
     the path itself never throws the sparkle back to the origin. */
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        className={className}
        style={{ transformOrigin: "0px 0px" }}
        d="M 0 -10 Q 1.5 -1.5 10 0 Q 1.5 1.5 0 10 Q -1.5 1.5 -10 0 Q -1.5 -1.5 0 -10 Z"
        fill={PALETTE.sun}
        stroke={PALETTE.ink}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function Zzz({ x, y }: { x: number; y: number }) {
  return (
    <g fill={PALETTE.ink} fontFamily="var(--font-display)" fontWeight="900">
      <text x={x} y={y} fontSize="22" className="otter-z otter-z-1">z</text>
      <text x={x + 16} y={y - 18} fontSize="17" className="otter-z otter-z-2">z</text>
      <text x={x + 28} y={y - 34} fontSize="13" className="otter-z otter-z-3">z</text>
    </g>
  );
}
