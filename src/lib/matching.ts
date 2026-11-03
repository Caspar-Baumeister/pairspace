/**
 * Matching math for one flat. docs/MATCHING.md explains it in plain words.
 *
 * Every applicant rates every other applicant on five steps and ranks the
 * rooms. That gives a weighted, undirected graph:
 *
 *   u(vote)  = 0, .25, .5, .75, 1   for no way, bad, okay, good, absolutely
 *   w(i, j)  = sqrt(u(i→j) · u(j→i))         geometric mean, so a one sided
 *                                            crush counts less than a mutual one
 *
 * A veto in either direction blocks the pair. For a group G of k people:
 *
 *   H(G) = ½ · mean w  +  ½ · min w          harmony: the average pair and the
 *                                            weakest pair count equally
 *   R(G) = best room assignment (Hungarian algorithm), mean room satisfaction
 *   S(G) = 100 · (0.75 · H + 0.25 · R)
 *
 * Finding the best G is a maximum weight k subgraph problem. It is NP hard in
 * general but the numbers are small, so we enumerate every group exactly with
 * branch and bound when that is cheap and fall back to local search otherwise.
 */
import type { Applicant, Ballot, Room, Vote } from "./types";

export const VOTE_UTILITY: Record<Vote, number> = { [-2]: 0, [-1]: 0.25, 0: 0.5, 1: 0.75, 2: 1 };
/** A missing vote is treated as neutral and shows up in the group's rated count instead. */
const UNKNOWN = 0.5;
export const HARMONY_WEIGHT = 0.75;

export interface MatchModel {
  ids: string[];
  index: Map<string, number>;
  n: number;
  /** n × n pair weight, symmetric. */
  w: Float64Array;
  /** n × n, 1 when either side vetoed. */
  veto: Uint8Array;
  /** Directed votes, vote[i][j] is how i rated j. */
  vote: (Vote | null)[][];
  roomIds: string[];
  /** n × rooms, satisfaction 0 to 1 per room. */
  roomFit: number[][];
  /** Mean utility of the votes each person received, null without votes. */
  received: (number | null)[];
}

export function buildModel(
  applicants: Pick<Applicant, "uid">[],
  ballots: Record<string, Ballot | undefined>,
  rooms: Pick<Room, "id">[],
): MatchModel {
  const ids = applicants.map((a) => a.uid);
  const n = ids.length;
  const index = new Map(ids.map((id, i) => [id, i]));
  const vote: (Vote | null)[][] = ids.map((from) =>
    ids.map((to) => (from === to ? null : (ballots[from]?.votes?.[to] ?? null))),
  );

  const w = new Float64Array(n * n);
  const veto = new Uint8Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = vote[i][j];
      const b = vote[j][i];
      const blocked = a === -2 || b === -2;
      const ua = a === null ? UNKNOWN : VOTE_UTILITY[a];
      const ub = b === null ? UNKNOWN : VOTE_UTILITY[b];
      const value = blocked ? 0 : Math.sqrt(ua * ub);
      w[i * n + j] = w[j * n + i] = value;
      veto[i * n + j] = veto[j * n + i] = blocked ? 1 : 0;
    }
  }

  const received = ids.map((_, j) => {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
      const v = vote[i][j];
      if (v === null) continue;
      sum += VOTE_UTILITY[v];
      count++;
    }
    return count ? sum / count : null;
  });

  const roomIds = rooms.map((r) => r.id);
  const m = roomIds.length;
  const roomFit = ids.map((id) => {
    const ranks = ballots[id]?.roomRanks ?? {};
    const ranked = roomIds.some((r) => typeof ranks[r] === "number");
    return roomIds.map((r) => {
      if (m <= 1) return 1;
      if (!ranked) return UNKNOWN;
      const rank = Math.min(Math.max(ranks[r] ?? m, 1), m);
      return (m - rank) / (m - 1);
    });
  });

  return { ids, index, n, w, veto, vote, roomIds, roomFit, received };
}

/* -------------------------------------------------------------- one group */

export interface GroupResult {
  members: string[];
  /** 0 to 100. */
  score: number;
  harmony: number;
  meanPair: number;
  minPair: number;
  roomFit: number;
  /** uid to room id. */
  assignment: Record<string, string>;
  /** Directed votes inside the group that exist, out of possible = k · (k − 1). */
  rated: number;
  possible: number;
  /** Pairs where both said good or absolutely. */
  mutualLikes: number;
}

export function evaluateGroup(model: MatchModel, members: number[]): GroupResult | null {
  const { n, w, veto, vote } = model;
  let sum = 0;
  let min = 1;
  let pairs = 0;
  let known = 0;
  let mutualLikes = 0;
  for (let a = 0; a < members.length; a++) {
    for (let b = a + 1; b < members.length; b++) {
      const i = members[a];
      const j = members[b];
      if (veto[i * n + j]) return null;
      const value = w[i * n + j];
      sum += value;
      min = Math.min(min, value);
      pairs++;
      if (vote[i][j] !== null) known++;
      if (vote[j][i] !== null) known++;
      if ((vote[i][j] ?? 0) >= 1 && (vote[j][i] ?? 0) >= 1) mutualLikes++;
    }
  }
  const meanPair = pairs ? sum / pairs : 1;
  const minPair = pairs ? min : 1;
  const harmony = 0.5 * meanPair + 0.5 * minPair;

  const { assignment, fit } = assignRooms(model, members);
  const score = 100 * (HARMONY_WEIGHT * harmony + (1 - HARMONY_WEIGHT) * fit);

  return {
    members: members.map((i) => model.ids[i]),
    score,
    harmony,
    meanPair,
    minPair,
    roomFit: fit,
    assignment,
    rated: known,
    possible: pairs * 2,
    mutualLikes,
  };
}

/** Optimal room assignment for a group, Hungarian algorithm on 1 − satisfaction. */
export function assignRooms(
  model: MatchModel,
  members: number[],
): { assignment: Record<string, string>; fit: number } {
  const m = model.roomIds.length;
  if (!m || !members.length) return { assignment: {}, fit: 1 };
  const size = Math.max(members.length, m);
  const cost = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) =>
      r < members.length && c < m ? 1 - model.roomFit[members[r]][c] : 0,
    ),
  );
  const match = hungarian(cost);
  const assignment: Record<string, string> = {};
  let total = 0;
  members.forEach((person, r) => {
    const c = match[r];
    if (c < m) {
      assignment[model.ids[person]] = model.roomIds[c];
      total += model.roomFit[person][c];
    }
  });
  return { assignment, fit: total / members.length };
}

/**
 * Minimum cost perfect matching on a square matrix, O(n³).
 * Returns for every row the column it is matched to.
 */
export function hungarian(cost: number[][]): number[] {
  const n = cost.length;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const result = new Array(n).fill(0);
  for (let j = 1; j <= n; j++) if (p[j]) result[p[j] - 1] = j - 1;
  return result;
}

/* ------------------------------------------------------------ best groups */

const EXACT_LIMIT = 400_000;

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

/**
 * The best groups of `k` people, highest score first. With `fixed`, only
 * groups that contain that person (an index into model.ids).
 */
export function bestGroups(model: MatchModel, k: number, limit = 8, fixed?: number): GroupResult[] {
  const size = Math.min(k, model.n);
  if (size <= 0) return [];
  const space = fixed === undefined ? binomial(model.n, size) : binomial(model.n - 1, size - 1);
  return space <= EXACT_LIMIT
    ? exactSearch(model, size, limit, fixed)
    : localSearch(model, size, limit, fixed);
}

/** Every group, pruned by an upper bound on what the unfinished group can still reach. */
export function exactSearch(model: MatchModel, size: number, limit: number, fixed?: number): GroupResult[] {
  const { n, w, veto } = model;
  const totalPairs = (size * (size - 1)) / 2;
  const top: GroupResult[] = [];
  const chosen: number[] = fixed === undefined ? [] : [fixed];

  const floor = () => (top.length < limit ? -1 : top[top.length - 1].score);
  const push = (g: GroupResult) => {
    top.push(g);
    top.sort((a, b) => b.score - a.score);
    if (top.length > limit) top.pop();
  };

  const dfs = (start: number, sum: number, min: number, pairs: number) => {
    if (chosen.length === size) {
      const g = evaluateGroup(model, chosen);
      if (g && g.score > floor()) push(g);
      return;
    }
    // Remaining pairs could at best weigh 1 each, rooms could at best fit perfectly.
    const meanUb = totalPairs ? (sum + (totalPairs - pairs)) / totalPairs : 1;
    const bound = 100 * (HARMONY_WEIGHT * (0.5 * meanUb + 0.5 * min) + (1 - HARMONY_WEIGHT));
    if (bound <= floor()) return;

    for (let i = start; i <= n - (size - chosen.length); i++) {
      if (i === fixed) continue;
      let s = sum;
      let mn = min;
      let ok = true;
      for (const j of chosen) {
        if (veto[i * n + j]) {
          ok = false;
          break;
        }
        s += w[i * n + j];
        mn = Math.min(mn, w[i * n + j]);
      }
      if (!ok) continue;
      chosen.push(i);
      dfs(i + 1, s, mn, pairs + chosen.length - 1);
      chosen.pop();
    }
  };
  dfs(0, 0, 1, 0);
  return top;
}

/** Greedy start from every person, then swap members in and out while it helps. */
export function localSearch(model: MatchModel, size: number, limit: number, fixed?: number): GroupResult[] {
  const { n, w, veto } = model;
  const seen = new Map<string, GroupResult>();
  const seeds = fixed === undefined ? Array.from({ length: n }, (_, i) => i) : [fixed];

  for (const seed of seeds) {
    const group = [seed];
    while (group.length < size) {
      let best = -1;
      let bestGain = -Infinity;
      for (let c = 0; c < n; c++) {
        if (group.includes(c) || group.some((g) => veto[c * n + g])) continue;
        let gain = 0;
        let mn = 1;
        for (const g of group) {
          gain += w[c * n + g];
          mn = Math.min(mn, w[c * n + g]);
        }
        gain = gain / group.length + mn;
        if (gain > bestGain) {
          bestGain = gain;
          best = c;
        }
      }
      if (best < 0) break;
      group.push(best);
    }
    if (group.length < size) continue;

    let current = evaluateGroup(model, group);
    if (!current) continue;
    for (let improved = true; improved; ) {
      improved = false;
      // The fixed person sits at position 0 and never leaves.
      for (let out = fixed === undefined ? 0 : 1; out < size && !improved; out++) {
        for (let c = 0; c < n && !improved; c++) {
          if (group.includes(c)) continue;
          const trial = group.slice();
          trial[out] = c;
          const g = evaluateGroup(model, trial);
          if (g && g.score > current.score + 1e-9) {
            group[out] = c;
            current = g;
            improved = true;
          }
        }
      }
    }
    const key = [...current.members].sort().join("|");
    seen.set(key, current);
  }
  return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

/* --------------------------------------------------------- graph helpers */

export interface GraphEdge {
  a: string;
  b: string;
  w: number;
  /** Positive part rescaled to 0..1, 0 means not drawn. */
  strength: number;
  veto: boolean;
  mutualLike: boolean;
}

export function graphEdges(model: MatchModel): GraphEdge[] {
  const { n, ids, w, veto, vote } = model;
  const out: GraphEdge[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (vote[i][j] === null && vote[j][i] === null) continue;
      const value = w[i * n + j];
      out.push({
        a: ids[i],
        b: ids[j],
        w: value,
        strength: Math.max(0, (value - 0.5) * 2),
        veto: veto[i * n + j] === 1,
        mutualLike: (vote[i][j] ?? 0) >= 1 && (vote[j][i] ?? 0) >= 1,
      });
    }
  }
  return out;
}

/**
 * Natural clusters for colouring the graph, Louvain local moving on the
 * positive part of the pair weights. Returns a cluster number per person,
 * numbered by size, or -1 for people without any positive tie.
 */
export function clusters(model: MatchModel): number[] {
  const { n, w, veto } = model;
  const p = new Float64Array(n * n);
  const degree = new Float64Array(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j || veto[i * n + j]) continue;
      const value = Math.max(0, (w[i * n + j] - 0.5) * 2);
      p[i * n + j] = value;
      degree[i] += value;
      total += value;
    }
  }
  if (total === 0) return new Array(n).fill(-1);

  const comm = Array.from({ length: n }, (_, i) => i);
  const tot = Float64Array.from(degree);
  for (let round = 0; round < 30; round++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      if (degree[i] === 0) continue;
      const own = comm[i];
      tot[own] -= degree[i];
      const links = new Map<number, number>();
      for (let j = 0; j < n; j++) {
        if (p[i * n + j] > 0 && j !== i) links.set(comm[j], (links.get(comm[j]) ?? 0) + p[i * n + j]);
      }
      let best = own;
      let bestGain = (links.get(own) ?? 0) - (tot[own] * degree[i]) / total;
      for (const [c, kin] of links) {
        // A veto inside the target cluster keeps people apart.
        let blocked = false;
        for (let j = 0; j < n && !blocked; j++) if (comm[j] === c && veto[i * n + j]) blocked = true;
        if (blocked) continue;
        const gain = kin - (tot[c] * degree[i]) / total;
        if (gain > bestGain + 1e-12) {
          bestGain = gain;
          best = c;
        }
      }
      comm[i] = best;
      tot[best] += degree[i];
      if (best !== own) moved = true;
    }
    if (!moved) break;
  }

  const sizes = new Map<number, number>();
  comm.forEach((c, i) => degree[i] > 0 && sizes.set(c, (sizes.get(c) ?? 0) + 1));
  const order = [...sizes.entries()]
    .filter(([, size]) => size > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
  return comm.map((c) => order.indexOf(c));
}
