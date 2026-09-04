import type { EventQuestion, MatchResult, PairspaceEvent, Participant } from "./types";

function answerOf(p: Participant, questionId: string): string[] {
  const found = p.answers.find((a) => a.questionId === questionId);
  if (!found) return [];
  return Array.isArray(found.value) ? found.value : [found.value];
}

function overlap(a: string[], b: string[]): string[] {
  return a.filter((v) => b.includes(v));
}

/**
 * Scores every other participant against the viewer.
 *
 * The score is intentionally simple and explainable. Each participant sees why
 * someone shows up near the top, which matters far more than a clever ranking.
 *
 *   category fit      up to 60 points
 *   matching answers  up to 30 points
 *   still open        10 points
 */
export function rankMatches(
  viewer: Participant,
  others: Participant[],
  event: PairspaceEvent,
): MatchResult[] {
  const matchingQuestions = event.questions.filter((q) => q.usedForMatching);

  const results = others
    .filter((p) => p.id !== viewer.id)
    .map<MatchResult>((p) => {
      const reasons: string[] = [];
      let score = 0;

      const wantsThem = overlap(viewer.lookingForIds, p.categoryIds);
      const wantsYou = overlap(p.lookingForIds, viewer.categoryIds);

      if (wantsThem.length && wantsYou.length) {
        score += 60;
        reasons.push("You are looking for each other");
      } else if (wantsThem.length) {
        score += 34;
        reasons.push(`Offers ${labelFor(event, wantsThem[0])}`);
      } else if (wantsYou.length) {
        score += 22;
        reasons.push("Looking for what you offer");
      }

      for (const q of matchingQuestions) {
        const mine = answerOf(viewer, q.id);
        const theirs = answerOf(p, q.id);
        if (!mine.length || !theirs.length) continue;
        const shared = overlap(mine, theirs);
        if (shared.length) {
          score += Math.min(15, 30 / Math.max(1, matchingQuestions.length));
          // Long skill lists would flood the card, so name at most two and count the rest.
          reasons.push(
            shared.length > 2
              ? `${q.label}: ${shared.length} in common`
              : `${q.label}: ${shared.join(", ")}`,
          );
        } else if (q.type === "single" && isAdjacentLevel(q, mine[0], theirs[0])) {
          score += 6;
          reasons.push(`${q.label}: close to yours`);
        }
      }

      if (p.open) {
        score += 10;
      } else {
        reasons.push("Already found a partner");
      }

      return { participant: p, score: Math.round(score), reasons: reasons.slice(0, 3) };
    });

  return results.sort((a, b) => b.score - a.score || b.participant.createdAt - a.participant.createdAt);
}

function isAdjacentLevel(q: EventQuestion, a: string, b: string): boolean {
  const ia = q.options.indexOf(a);
  const ib = q.options.indexOf(b);
  if (ia < 0 || ib < 0) return false;
  return Math.abs(ia - ib) === 1;
}

export function labelFor(event: PairspaceEvent, categoryId: string): string {
  return event.categories.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function matchStrength(score: number): { label: string; tone: "high" | "mid" | "low" } {
  if (score >= 70) return { label: "Strong match", tone: "high" };
  if (score >= 40) return { label: "Possible match", tone: "mid" };
  return { label: "Also at this event", tone: "low" };
}
