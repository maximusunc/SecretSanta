import { describe, expect, it } from "vitest";
import { drawNames } from "../src/lib/draw";

const family = [1, 2, 3, 4, 5, 6];
const spouses: [number, number][] = [
  [1, 2],
  [3, 4],
  [5, 6],
];

function assertValid(pairs: Map<number, number>, prev = new Map<number, number>()) {
  expect([...pairs.keys()].sort()).toEqual(family);
  expect([...pairs.values()].sort()).toEqual(family);
  for (const [g, r] of pairs) {
    expect(r).not.toBe(g);
    expect(spouses.some(([a, b]) => (a === g && b === r) || (a === r && b === g))).toBe(false);
    expect(prev.get(g)).not.toBe(r);
  }
}

describe("drawNames", () => {
  it("never assigns self or spouse", () => {
    for (let i = 0; i < 200; i++) {
      const res = drawNames({ participants: family, spouses, previous: new Map() });
      expect(res.ok).toBe(true);
      if (res.ok) assertValid(res.pairs);
    }
  });

  it("respects last year's pairings", () => {
    const previous = new Map([
      [1, 3], [2, 5], [3, 6], [4, 1], [5, 4], [6, 2],
    ]);
    for (let i = 0; i < 200; i++) {
      const res = drawNames({ participants: family, spouses, previous });
      expect(res.ok).toBe(true);
      if (res.ok) assertValid(res.pairs, previous);
    }
  });

  it("reaches every valid pairing (uniform sampling)", () => {
    const seen = new Set<string>();
    let total = 0;
    for (let i = 0; i < 3000; i++) {
      const res = drawNames({ participants: family, spouses, previous: new Map() });
      if (!res.ok) throw new Error(res.reason);
      total = res.possibilities;
      seen.add(family.map((g) => res.pairs.get(g)).join(","));
    }
    expect(seen.size).toBe(total);
  });

  it("reports impossible constraints", () => {
    const res = drawNames({ participants: [1, 2], spouses: [[1, 2]], previous: new Map() });
    expect(res.ok).toBe(false);
  });
});
