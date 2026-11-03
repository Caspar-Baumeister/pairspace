import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

/**
 * Demo data and a precomputed layout for the landing page graph. Same people
 * and look as the promo video (pairspace-promo), sized for the hero window.
 * The layout is computed once, one tick per frame, so the page can play it
 * back smoothly and server and client agree on every position.
 */

export type Camp = "calm" | "social" | "creative" | "sporty";

export interface HeroPerson {
  id: string;
  name: string;
  /** File in public/faces, without extension. */
  face: string | null;
  camp: Camp;
}

const p = (id: string, name: string, camp: Camp, face: string | null = null): HeroPerson => ({ id, name, camp, face });

export const PEOPLE: HeroPerson[] = [
  p("felix", "Felix", "calm", "1506794778202-cad84cf45f1d"),
  p("hannah", "Hannah", "calm", "1544005313-94ddf0286df2"),
  p("david", "David", "calm", "1519085360753-af0119f7cbe7"),
  p("clara", "Clara", "calm", "1573496359142-b8d87734a5a2"),
  p("katrin", "Katrin", "calm", "1508214751196-bcfd4ca60f91"),
  p("moritz", "Moritz", "calm", "1557862921-37829c790f19"),
  p("jan", "Jan", "calm", "1599566150163-29194dcaad36"),
  p("nora", "Nora", "calm", "1607746882042-944635dfe10e"),
  p("ben", "Ben", "calm", "1535713875002-d1d0cf377fde"),
  p("lena", "Lena", "social", "1494790108377-be9c29b29330"),
  p("jonas", "Jonas", "social", "1500648767791-00dcc994a43e"),
  p("mia", "Mia", "social", "1438761681033-6461ffad8d80"),
  p("paul", "Paul", "social", "1507003211169-0a1dd7228f2d"),
  p("sophie", "Sophie", "social", "1534528741775-53994a69daeb"),
  p("lea", "Lea", "social", "1489424731084-a5d8b219a5bb"),
  p("tim", "Tim", "social", "1527980965255-d3b416303d12"),
  p("laura", "Laura", "social", "1546961329-78bef0414d7c"),
  p("can", "Can", "social", "1564564321837-a57b7070ac4f"),
  p("noah", "Noah", "creative", "1539571696357-5a69c17a67c6"),
  p("emma", "Emma", "creative", "1524504388940-b1c1722653e1"),
  p("luis", "Luis", "creative", "1531427186611-ecfd6d936c79"),
  p("nele", "Nele", "creative", "1502823403499-6ccfcf4fb453"),
  p("marie", "Marie", "creative", "1529626455594-4ff0802cfb7e"),
  p("amara", "Amara", "creative", "1531123897727-8f129e1688ce"),
  p("elias", "Elias", "creative", "1628157588553-5eeea00af15c"),
  p("kenji", "Kenji", "creative", "1542909168-82c3e7fdca5c"),
  p("ida", "Ida", "creative", "1554151228-14d9def656e4"),
  p("max", "Max", "sporty", "1472099645785-5658abf4ff4e"),
  p("sara", "Sara", "sporty", "1580489944761-15a19d654956"),
  p("ana", "Ana", "sporty", "1488426862026-3ee34a7d66df"),
  p("jule", "Jule", "sporty", "1517841905240-472988babdf9"),
  p("samuel", "Samuel", "sporty", "1521119989659-a83eee488004"),
  p("tobias", "Tobias", "sporty", "1547425260-76bcadfb4f2c"),
  p("henrik", "Henrik", "sporty", "1552058544-f2b08422138a"),
  p("leon", "Leon", "sporty", "1570295999919-56ceb5ecca61"),
  p("finn", "Finn", "sporty", "1633332755192-727a05c4013d"),
  p("tom", "Tom", "calm"),
  p("aylin", "Aylin", "calm"),
  p("mila", "Mila", "calm"),
  p("pia", "Pia", "social"),
  p("malte", "Malte", "social"),
  p("lina", "Lina", "social"),
  p("ole", "Ole", "creative"),
  p("greta", "Greta", "creative"),
  p("jakob", "Jakob", "creative"),
  p("zoe", "Zoe", "sporty"),
  p("erik", "Erik", "sporty"),
  p("arne", "Arne", "sporty"),
];

export const CAMP_COLOR: Record<Camp, string> = {
  calm: "#53dfdd",
  social: "#e9973f",
  creative: "#44cf6e",
  sporty: "#fa99cd",
};

export const indexOf = (id: string) => PEOPLE.findIndex((x) => x.id === id);

/** The groups the right panel recommends, best first. */
export const GROUPS = [
  { ids: ["hannah", "felix", "david"], score: 94 },
  { ids: ["lena", "mia", "sophie"], score: 89 },
  { ids: ["noah", "emma", "luis"], score: 86 },
];
export const TRIO = GROUPS[0].ids.map(indexOf);

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export interface HeroLink {
  a: number;
  b: number;
  s: number;
}

export const LINKS: HeroLink[] = (() => {
  const rand = rng(2026);
  const trio = new Set(TRIO);
  const out: HeroLink[] = [];
  for (let a = 0; a < PEOPLE.length; a++) {
    for (let b = a + 1; b < PEOPLE.length; b++) {
      if (trio.has(a) && trio.has(b)) {
        out.push({ a, b, s: 1 });
        continue;
      }
      const same = PEOPLE[a].camp === PEOPLE[b].camp;
      const r = rand();
      if (same && r < 0.5) out.push({ a, b, s: 0.45 + 0.5 * rand() });
      else if (!same && r < 0.045) out.push({ a, b, s: 0.15 + 0.3 * rand() });
    }
  }
  return out;
})();

/* ---------------------------------------------------------------- timing */

export const FPS = 30;
/** Last frame of the spawn flurry. */
export const SPAWN_END = 150;
export const COLOR_AT = 150;
export const MATCH_AT = 186;
export const FRAMES = 260;

export const SPAWN_FRAME: number[] = (() => {
  const first = ["lena", "felix", "noah", "hannah", "max", "emma", "david", "sophie", "jonas", "clara"].map(indexOf);
  const rand = rng(99);
  const rest = PEOPLE.map((_, i) => i)
    .filter((i) => !first.includes(i))
    .map((i) => ({ i, k: rand() + (PEOPLE[i].face ? 0 : 0.45) }))
    .sort((x, y) => x.k - y.k)
    .map((x) => x.i);
  const order = [...first, ...rest];
  const frames = new Array<number>(PEOPLE.length);
  order.forEach((person, k) => {
    frames[person] = Math.round(6 + (SPAWN_END - 6) * Math.pow(k / (order.length - 1), 0.8));
  });
  return frames;
})();

/* ---------------------------------------------------------------- layout */

/** Graph coordinates, the hero draws them into this box. */
export const VIEW = { w: 820, h: 520 };

const ANCHOR: Record<Camp, [number, number]> = {
  calm: [-230, -10],
  social: [100, -140],
  creative: [235, 95],
  sporty: [-45, 150],
};

export const nodeRadius = (i: number) => (PEOPLE[i].face ? 15 : 10.5);

interface Node extends SimulationNodeDatum {
  i: number;
  r: number;
  camp: Camp;
}
type Edge = SimulationLinkDatum<Node> & { s: number };

function simulate() {
  const rand = rng(7);
  const nodes: Node[] = PEOPLE.map((x, i) => ({ i, r: nodeRadius(i), camp: x.camp }));
  const live: Node[] = [];
  const links = forceLink<Node, Edge>([])
    .distance((l) => 96 - 46 * l.s)
    .strength((l) => 0.06 + 0.3 * l.s);
  const sim = forceSimulation<Node>([])
    .stop()
    .randomSource(rng(11))
    .velocityDecay(0.38)
    .force("link", links)
    .force("charge", forceManyBody<Node>().strength(-75).distanceMax(320))
    .force("collide", forceCollide<Node>((d) => d.r + 7).strength(0.9))
    .force("x", forceX<Node>((d) => ANCHOR[d.camp][0]).strength(0.05))
    .force("y", forceY<Node>((d) => ANCHOR[d.camp][1]).strength(0.05));

  const xs: Float32Array[] = [];
  const ys: Float32Array[] = [];
  for (let f = 0; f < FRAMES; f++) {
    let added = false;
    for (const n of nodes) {
      if (SPAWN_FRAME[n.i] !== f) continue;
      const [ax, ay] = ANCHOR[n.camp];
      n.x = ax * 0.5 + (rand() - 0.5) * 80;
      n.y = ay * 0.5 + (rand() - 0.5) * 80;
      n.vx = 0;
      n.vy = 0;
      live.push(n);
      added = true;
    }
    if (added) {
      const on = new Set(live.map((n) => n.i));
      sim.nodes(live);
      links.links(LINKS.filter((l) => on.has(l.a) && on.has(l.b)).map((l) => ({ source: nodes[l.a], target: nodes[l.b], s: l.s })));
      sim.alpha(Math.max(sim.alpha(), 0.55));
    }
    sim.tick();
    const x = new Float32Array(nodes.length).fill(NaN);
    const y = new Float32Array(nodes.length).fill(NaN);
    for (const n of live) {
      x[n.i] = n.x! + VIEW.w / 2;
      y[n.i] = n.y! + VIEW.h / 2;
    }
    xs.push(x);
    ys.push(y);
  }
  return { xs, ys };
}

let cached: ReturnType<typeof simulate> | null = null;

/** Positions per frame, computed on first use. */
export function layout() {
  return (cached ??= simulate());
}
