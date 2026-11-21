/**
 * Secret Santa draw: assign every participant exactly one receiver such that
 *   - nobody draws themselves,
 *   - nobody draws their spouse,
 *   - nobody draws the person they had last year.
 *
 * We enumerate every valid assignment (cheap for a family-sized group) and pick
 * one uniformly at random, so no valid pairing is more likely than another.
 * For larger groups enumeration is capped and we sample from what we found.
 */

export type DrawInput = {
  participants: number[];
  /** Pairs that may not draw each other, in either direction. */
  spouses: [number, number][];
  /** giver -> receiver from the previous year; that giver may not get them again. */
  previous: Map<number, number>;
  /** Used only to make error messages friendly. */
  nameOf?: (id: number) => string;
};

export type DrawResult =
  | { ok: true; pairs: Map<number, number>; possibilities: number }
  | { ok: false; reason: string };

const ENUMERATION_CAP = 50_000;

export function allowedReceivers(input: DrawInput): Map<number, number[]> {
  const spouseOf = new Map<number, Set<number>>();
  for (const [a, b] of input.spouses) {
    if (!spouseOf.has(a)) spouseOf.set(a, new Set());
    if (!spouseOf.has(b)) spouseOf.set(b, new Set());
    spouseOf.get(a)!.add(b);
    spouseOf.get(b)!.add(a);
  }
  const allowed = new Map<number, number[]>();
  for (const giver of input.participants) {
    allowed.set(
      giver,
      input.participants.filter(
        (r) =>
          r !== giver &&
          !spouseOf.get(giver)?.has(r) &&
          input.previous.get(giver) !== r,
      ),
    );
  }
  return allowed;
}

export function drawNames(
  input: DrawInput,
  random: () => number = Math.random,
): DrawResult {
  const people = [...new Set(input.participants)];
  if (people.length < 2) {
    return { ok: false, reason: "You need at least two people to draw names." };
  }

  const allowed = allowedReceivers({ ...input, participants: people });
  for (const [giver, options] of allowed) {
    if (options.length === 0) {
      return {
        ok: false,
        reason: `There is nobody ${input.nameOf?.(giver) ?? `participant #${giver}`} is allowed to draw.`,
      };
    }
  }

  // Most-constrained givers first keeps the search small.
  const givers = [...people].sort(
    (a, b) => allowed.get(a)!.length - allowed.get(b)!.length,
  );
  const solutions: number[][] = [];
  const taken = new Set<number>();
  const current: number[] = [];

  const search = (i: number) => {
    if (solutions.length >= ENUMERATION_CAP) return;
    if (i === givers.length) {
      solutions.push([...current]);
      return;
    }
    // Shuffle so a capped enumeration is still a random sample.
    for (const r of shuffle(allowed.get(givers[i])!, random)) {
      if (taken.has(r)) continue;
      taken.add(r);
      current.push(r);
      search(i + 1);
      current.pop();
      taken.delete(r);
    }
  };
  search(0);

  if (solutions.length === 0) {
    return {
      ok: false,
      reason:
        "No valid draw exists with these rules (spouses + last year's pairings). " +
        "Try removing last year's restriction for this draw.",
    };
  }

  const pick = solutions[Math.floor(random() * solutions.length)];
  const pairs = new Map<number, number>();
  givers.forEach((g, i) => pairs.set(g, pick[i]));
  return { ok: true, pairs, possibilities: solutions.length };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
