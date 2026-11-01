/**
 * Checks the matching math against brute force on random flats.
 *
 *   npm run test:matching
 */
import assert from "node:assert/strict";

import {
  assignRooms,
  buildModel,
  clusters,
  evaluateGroup,
  exactSearch,
  hungarian,
  localSearch,
} from "../src/lib/matching.ts";

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];

function permutations(n: number): number[][] {
  if (n === 1) return [[0]];
  return permutations(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));
}

function combos(n: number, k: number, start = 0, acc: number[] = []): number[][] {
  if (acc.length === k) return [acc];
  const out: number[][] = [];
  for (let i = start; i < n; i++) out.push(...combos(n, k, i + 1, [...acc, i]));
  return out;
}

function randomFlat(n: number, rooms: number, vetoRate = 0.05, missingRate = 0.15) {
  const applicants = Array.from({ length: n }, (_, i) => ({ uid: `p${i}` }));
  const roomList = Array.from({ length: rooms }, (_, i) => ({ id: `r${i}` }));
  const ballots: Record<string, any> = {};
  for (const a of applicants) {
    const votes: Record<string, number> = {};
    for (const b of applicants) {
      if (a === b || rand() < missingRate) continue;
      votes[b.uid] = rand() < vetoRate ? -2 : pick([-1, 0, 0, 1, 1, 2]);
    }
    const order = roomList.map((r) => r.id).sort(() => rand() - 0.5);
    const roomRanks: Record<string, number> = {};
    order.forEach((id, i) => (roomRanks[id] = i + 1));
    ballots[a.uid] = { uid: a.uid, votes, roomRanks, updatedAt: 0 };
  }
  return buildModel(applicants, ballots, roomList);
}

// 1. Hungarian equals the best permutation.
for (let t = 0; t < 200; t++) {
  const n = 1 + Math.floor(rand() * 6);
  const cost = Array.from({ length: n }, () => Array.from({ length: n }, () => Math.round(rand() * 100) / 100));
  const match = hungarian(cost);
  const got = match.reduce((s, c, r) => s + cost[r][c], 0);
  const best = Math.min(...permutations(n).map((p) => p.reduce((s, c, r) => s + cost[r][c], 0)));
  assert.ok(Math.abs(got - best) < 1e-9, `hungarian ${got} vs ${best}`);
  assert.equal(new Set(match).size, n, "hungarian must be a permutation");
}

// 2. Exact search equals brute force over every group.
for (let t = 0; t < 40; t++) {
  const n = 4 + Math.floor(rand() * 7);
  const k = 2 + Math.floor(rand() * 3);
  const model = randomFlat(n, k);
  const top = exactSearch(model, Math.min(k, n), 5);
  const all = combos(n, Math.min(k, n))
    .map((c) => evaluateGroup(model, c))
    .filter((g) => g !== null)
    .sort((a, b) => b!.score - a!.score);
  if (!all.length) {
    assert.equal(top.length, 0);
    continue;
  }
  assert.ok(Math.abs(top[0].score - all[0]!.score) < 1e-9, `exact ${top[0].score} vs brute ${all[0]!.score}`);
  top.forEach((g, i) => assert.ok(Math.abs(g.score - all[i]!.score) < 1e-9, "top list order"));
}

// 3. Local search finds a group close to the exact optimum and never a vetoed one.
let gap = 0;
for (let t = 0; t < 30; t++) {
  const model = randomFlat(16, 4);
  const exact = exactSearch(model, 4, 1)[0];
  const local = localSearch(model, 4, 1)[0];
  if (!exact) continue;
  assert.ok(local, "local search found nothing");
  assert.ok(evaluateGroup(model, local.members.map((id) => model.index.get(id)!)) !== null);
  gap = Math.max(gap, exact.score - local.score);
}
assert.ok(gap < 3, `local search gap too large: ${gap}`);

// 4. Mutual sympathy beats a one sided crush, a veto blocks the group.
{
  const model = buildModel(
    [{ uid: "a" }, { uid: "b" }, { uid: "c" }],
    {
      a: { uid: "a", votes: { b: 1, c: 2 }, roomRanks: {}, updatedAt: 0 },
      b: { uid: "b", votes: { a: 1, c: -2 }, roomRanks: {}, updatedAt: 0 },
      c: { uid: "c", votes: { a: -1, b: 0 }, roomRanks: {}, updatedAt: 0 },
    },
    [{ id: "r1" }, { id: "r2" }],
  );
  const ab = evaluateGroup(model, [0, 1])!;
  const ac = evaluateGroup(model, [0, 2])!;
  assert.ok(ab.score > ac.score, "mutual good beats absolutely and bad");
  assert.equal(evaluateGroup(model, [1, 2]), null, "veto blocks");
  assert.equal(ab.mutualLikes, 1);
}

// 5. Room assignment gives everyone their favourite when that is possible.
{
  const model = buildModel(
    [{ uid: "a" }, { uid: "b" }],
    {
      a: { uid: "a", votes: {}, roomRanks: { r1: 2, r2: 1 }, updatedAt: 0 },
      b: { uid: "b", votes: {}, roomRanks: { r1: 1, r2: 1 }, updatedAt: 0 },
    },
    [{ id: "r1" }, { id: "r2" }],
  );
  const { assignment, fit } = assignRooms(model, [0, 1]);
  assert.deepEqual(assignment, { a: "r2", b: "r1" });
  assert.equal(fit, 1);
}

// 6. Two obvious camps become two clusters.
{
  const people = ["a1", "a2", "a3", "b1", "b2", "b3"].map((uid) => ({ uid }));
  const ballots: Record<string, any> = {};
  for (const p of people) {
    const votes: Record<string, number> = {};
    for (const q of people) if (p !== q) votes[q.uid] = p.uid[0] === q.uid[0] ? 2 : -1;
    ballots[p.uid] = { uid: p.uid, votes, roomRanks: {}, updatedAt: 0 };
  }
  const c = clusters(buildModel(people, ballots, []));
  assert.equal(c[0], c[1]);
  assert.equal(c[1], c[2]);
  assert.equal(c[3], c[4]);
  assert.notEqual(c[0], c[3]);
}

// 7. Speed: 60 applicants, 5 rooms (exact would be 5.4 million groups, so local search).
{
  const model = randomFlat(60, 5, 0.03, 0.2);
  const t0 = performance.now();
  const top = localSearch(model, 5, 8);
  const ms = performance.now() - t0;
  assert.ok(top.length > 0);
  console.log(`local search 60 people, 5 rooms: ${ms.toFixed(0)} ms, best ${top[0].score.toFixed(1)}`);
  const model2 = randomFlat(30, 4, 0.03, 0.2);
  const t1 = performance.now();
  exactSearch(model2, 4, 8);
  console.log(`exact search 30 people, 4 rooms (27 405 groups): ${(performance.now() - t1).toFixed(0)} ms`);
}

console.log(`all matching checks passed, worst local search gap ${gap.toFixed(2)} points`);

// 8. Groups with a fixed person equal brute force over the groups that contain them.
for (let t = 0; t < 20; t++) {
  const model = randomFlat(9, 3);
  const person = Math.floor(rand() * 9);
  const top = exactSearch(model, 3, 3, person);
  const all = combos(9, 3)
    .filter((c) => c.includes(person))
    .map((c) => evaluateGroup(model, c))
    .filter((g) => g !== null)
    .sort((a, b) => b!.score - a!.score);
  if (!all.length) continue;
  assert.ok(Math.abs(top[0].score - all[0]!.score) < 1e-9, "fixed person search");
  assert.ok(top.every((g) => g.members.includes(model.ids[person])));
  const local = localSearch(model, 3, 1, person)[0];
  if (local) assert.ok(local.members.includes(model.ids[person]));
}
console.log("fixed person checks passed");
