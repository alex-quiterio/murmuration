import { describe, expect, it } from "vitest";
import { bruteForceIndexer, FlockingRules, Murmuration, Seed, Sky } from "@domain";
import { SpatialHashIndexer } from "@infrastructure";

describe("SpatialHashIndexer", () => {
  it.each([1, 2, 3, 4, 5])("finds exactly the brute-force k nearest neighbours (seed %i)", (seed) => {
    const m = Murmuration.gather(FlockingRules.starlingDefaults(), Sky.of(1200, 800), Seed.of(seed));
    const fast = new SpatialHashIndexer().index(m.starlings);
    const spec = bruteForceIndexer.index(m.starlings);
    for (const s of m.starlings) {
      const distances = (n: ReturnType<typeof spec.nearest>) => n.map((x) => x.distanceSquared);
      expect(distances(fast.nearest(s, 7))).toEqual(distances(spec.nearest(s, 7)));
    }
  });
});
