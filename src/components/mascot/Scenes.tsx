/**
 * Ready made mascot scenes. Each one is a self contained SVG that scales with
 * its container width, so `<MascotLift className="w-64" />` just works.
 *
 * Use `label` when the scene carries meaning ("Kai is looking around, nobody
 * has joined yet"), leave it out when the drawing is decoration.
 */
import { Ground, Otter, PALETTE, Sparkle, Zzz } from "./Otter";

interface SceneProps {
  className?: string;
  label?: string;
}

function Svg({
  viewBox,
  className,
  label,
  children,
  clip = false,
}: SceneProps & { viewBox: string; clip?: boolean; children: React.ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      fill="none"
      style={{ display: "block", overflow: clip ? "hidden" : "visible" }}
    >
      {children}
    </svg>
  );
}

/** Kai lifts Mo overhead. The hero image, and the whole product in one picture. */
export function MascotLift(props: SceneProps) {
  return (
    <Svg viewBox="0 0 320 340" {...props}>
      <Ground cx={160} cy={334} rx={70} />
      <g className="otter-breathe" style={{ transformOrigin: "160px 334px" }}>
        <Otter
          who="kai"
          eyes="up"
          mouth="grin"
          armR={-82}
          armL={-82}
          armLength={90}
          transform="translate(60 140)"
        />
      </g>
      <g className="otter-hover" style={{ transformOrigin: "160px 118px" }}>
        <Otter
          who="mo"
          eyes="happy"
          mouth="open"
          armR={-70}
          armL={-70}
          transform="translate(160 118) rotate(-90) scale(0.74) translate(-100 -120)"
        />
      </g>
      <Sparkle x={62} y={92} s={0.9} className="otter-twinkle otter-twinkle-1" />
      <Sparkle x={262} y={70} s={1.1} className="otter-twinkle otter-twinkle-2" />
      <Sparkle x={236} y={150} s={0.6} className="otter-twinkle otter-twinkle-3" />
    </Svg>
  );
}

/** Kai waves hello. */
export function MascotWave(props: SceneProps) {
  return (
    <Svg viewBox="0 0 200 200" {...props}>
      <Ground />
      <g className="otter-breathe" style={{ transformOrigin: "100px 194px" }}>
        <Otter who="kai" eyes="open" mouth="grin" armR={-62} armL={30} armRClass="otter-wave" />
      </g>
    </Svg>
  );
}

/** Mo peeks in, head only. For corners and card edges. */
export function MascotPeek(props: SceneProps) {
  return (
    <Svg viewBox="0 0 200 124" clip {...props}>
      <g className="otter-peek" style={{ transformOrigin: "100px 124px" }}>
        <Otter who="mo" eyes="open" mouth="smile" look={{ x: -0.6, y: -0.4 }} armR={-20} armL={-20} />
      </g>
    </Svg>
  );
}

/** Kai and Mo hold paws. Otters do this so they never drift apart. */
export function MascotDuo(props: SceneProps) {
  return (
    <Svg viewBox="0 0 360 220" {...props}>
      <Ground cx={110} cy={214} rx={56} />
      <Ground cx={250} cy={214} rx={52} />
      <g className="otter-sway" style={{ transformOrigin: "110px 214px" }}>
        <Otter who="kai" eyes="happy" mouth="smile" armR={28} armL={40} transform="translate(10 20)" />
      </g>
      <g className="otter-sway otter-sway-late" style={{ transformOrigin: "250px 214px" }}>
        <Otter
          who="mo"
          eyes="happy"
          mouth="smile"
          armL={28}
          armR={40}
          transform="translate(250 214) scale(0.92) translate(-100 -194)"
        />
      </g>
    </Svg>
  );
}

/** Both cheer. Match found, request accepted, event created. */
export function MascotCheer(props: SceneProps) {
  return (
    <Svg viewBox="0 0 360 230" {...props}>
      <Ground cx={110} cy={224} rx={56} />
      <Ground cx={252} cy={224} rx={52} />
      <g className="otter-jump" style={{ transformOrigin: "110px 224px" }}>
        <Otter who="kai" eyes="happy" mouth="open" armR={-78} armL={-78} transform="translate(10 30)" />
      </g>
      <g className="otter-jump otter-jump-late" style={{ transformOrigin: "252px 224px" }}>
        <Otter
          who="mo"
          eyes="happy"
          mouth="open"
          armR={-78}
          armL={-78}
          transform="translate(252 224) scale(0.92) translate(-100 -194)"
        />
      </g>
      <Sparkle x={40} y={60} s={1} className="otter-twinkle otter-twinkle-1" />
      <Sparkle x={182} y={30} s={1.2} className="otter-twinkle otter-twinkle-2" />
      <Sparkle x={330} y={70} s={0.9} className="otter-twinkle otter-twinkle-3" />
      <Sparkle x={300} y={20} s={0.6} className="otter-twinkle otter-twinkle-1" />
    </Svg>
  );
}

/** Mo floats on the water, asleep. The loading screen. */
export function MascotFloat(props: SceneProps) {
  return (
    <Svg viewBox="0 0 280 180" {...props}>
      <g className="otter-float" style={{ transformOrigin: "140px 110px" }}>
        <Otter
          who="mo"
          eyes="closed"
          mouth="smile"
          armR={118}
          armL={118}
          transform="translate(140 96) rotate(-90) scale(0.8) translate(-100 -120)"
        />
      </g>
      <Zzz x={196} y={70} />
      <g className="otter-wave-line" stroke={PALETTE.teal} strokeWidth={5} strokeLinecap="round">
        <path d="M 20 140 Q 45 128 70 140 T 120 140 T 170 140 T 220 140 T 270 140" />
        <path d="M 40 160 Q 65 148 90 160 T 140 160 T 190 160 T 240 160" opacity="0.45" />
      </g>
    </Svg>
  );
}

/** Kai shades his eyes and looks around. Nobody here yet, or nothing found. */
export function MascotSearch(props: SceneProps) {
  return (
    <Svg viewBox="0 0 220 220" {...props}>
      <Ground cx={110} cy={214} rx={56} />
      <g className="otter-look" style={{ transformOrigin: "110px 214px" }}>
        <Otter
          who="kai"
          eyes="open"
          mouth="flat"
          armR={-100}
          armL={35}
          look={{ x: 0.8, y: 0 }}
          transform="translate(10 20)"
        />
      </g>
      <g className="otter-pop" style={{ transformOrigin: "186px 46px" }}>
        <circle cx="186" cy="46" r="22" fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={4} />
        <circle cx="166" cy="70" r="6" fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={3.5} />
        <text
          x="186"
          y="55"
          textAnchor="middle"
          fontSize="28"
          fontWeight="900"
          fontFamily="var(--font-display)"
          fill={PALETTE.ink}
        >
          ?
        </text>
      </g>
    </Svg>
  );
}

/** Mo is embarrassed. Something went wrong. */
export function MascotOops(props: SceneProps) {
  return (
    <Svg viewBox="0 0 220 220" {...props}>
      <Ground cx={110} cy={214} rx={54} />
      <g className="otter-shake" style={{ transformOrigin: "110px 214px" }}>
        <Otter
          who="mo"
          eyes="wide"
          mouth="o"
          armR={12}
          armL={12}
          sweat
          look={{ x: -0.5, y: 0.3 }}
          transform="translate(110 214) rotate(-6) translate(-100 -194)"
        />
      </g>
    </Svg>
  );
}

/** Kai thinks it over. Waiting states. */
export function MascotThink(props: SceneProps) {
  return (
    <Svg viewBox="0 0 220 220" {...props}>
      <Ground cx={110} cy={214} rx={56} />
      <g className="otter-breathe" style={{ transformOrigin: "110px 214px" }}>
        <Otter
          who="kai"
          eyes="up"
          mouth="flat"
          armR={-128}
          armL={38}
          look={{ x: 0.6, y: -0.3 }}
          transform="translate(10 20)"
        />
      </g>
      <g>
        <circle cx="168" cy="72" r="5" fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={3.5} />
        <circle cx="182" cy="54" r="8" fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={3.5} />
        <g className="otter-pop" style={{ transformOrigin: "196px 28px" }}>
          <circle cx="196" cy="28" r="20" fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={4} />
          <circle cx="186" cy="28" r="2.6" fill={PALETTE.ink} className="otter-dot otter-dot-1" />
          <circle cx="196" cy="28" r="2.6" fill={PALETTE.ink} className="otter-dot otter-dot-2" />
          <circle cx="206" cy="28" r="2.6" fill={PALETTE.ink} className="otter-dot otter-dot-3" />
        </g>
      </g>
    </Svg>
  );
}

/** Kai gives a thumbs up, arms crossed proudly. Used on the organizer side. */
export function MascotProud(props: SceneProps) {
  return (
    <Svg viewBox="0 0 200 200" {...props}>
      <Ground />
      <g className="otter-breathe" style={{ transformOrigin: "100px 194px" }}>
        <Otter who="kai" eyes="wink" mouth="grin" armR={-40} armL={122} />
      </g>
      <Sparkle x={168} y={62} s={0.8} className="otter-twinkle otter-twinkle-2" />
    </Svg>
  );
}
