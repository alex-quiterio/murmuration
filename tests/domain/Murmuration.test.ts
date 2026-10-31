import { describe, expect, it } from "vitest";
import {
  bruteForceIndexer,
  FlockingRules,
  InvariantViolation,
  Murmuration,
  Perception,
  Seed,
  Sky,
  Vector2,
} from "@domain";

const rules = FlockingRules.starlingDefaults();
const sky = Sky.of(800, 600);
const gather = (seed = 42) => Murmuration.gather(rules, sky, Seed.of(seed));
const positions = (m: Murmuration) => m.starlings.map((s) => [s.position.x, s.position.y]);

describe("Murmuration", () => {
  it("gathers exactly the population its rules ask for, inside the sky", () => {
    const m = gather();
    expect(m.population).toBe(rules.population);
    for (const s of m.starlings) {
      expect(s.position.x).toBeGreaterThanOrEqual(0);
      expect(s.position.x).toBeLessThan(sky.width);
      expect(s.position.y).toBeGreaterThanOrEqual(0);
      expect(s.position.y).toBeLessThan(sky.height);
    }
  });

  it("is deterministic: the same seed and commands give the same flock", () => {
    const run = () => gather(7).advance(bruteForceIndexer).scatter().advance(bruteForceIndexer);
    expect(positions(run())).toEqual(positions(run()));
    expect(positions(gather(7))).not.toEqual(positions(gather(8)));
  });

  it("never mutates: behaviours return a new aggregate and leave the old one intact", () => {
    const before = gather();
    const snapshot = positions(before);
    const after = before.advance(bruteForceIndexer);
    expect(after).not.toBe(before);
    expect(positions(before)).toEqual(snapshot);
  });

  it("keeps every starling's identity across ticks", () => {
    const m = gather();
    const ids = m.starlings.map((s) => s.id);
    expect(m.advance(bruteForceIndexer).starlings.map((s) => s.id)).toEqual(ids);
  });

  it("keeps survivors when the population changes", () => {
    const m = gather();
    const smaller = m.adopt(FlockingRules.of({ ...rules, population: 100 }));
    expect(smaller.population).toBe(100);
    expect(smaller.starlings).toEqual(m.starlings.slice(0, 100));

    const larger = smaller.adopt(FlockingRules.of({ ...rules, population: 150 }));
    expect(larger.population).toBe(150);
    expect(larger.starlings.slice(0, 100)).toEqual(smaller.starlings);
    expect(new Set(larger.starlings.map((s) => s.id)).size).toBe(150);
  });

  it("keeps every starling inside its flight envelope after a tick", () => {
    const { stallSpeed, topSpeed } = rules.envelope;
    for (const s of gather().scatter().advance(bruteForceIndexer).starlings) {
      expect(s.velocity.length).toBeLessThanOrEqual(topSpeed + 1e-9);
      expect(s.velocity.length).toBeGreaterThanOrEqual(stallSpeed - 1e-9);
    }
  });

  it("flees the falcon", () => {
    const m = Murmuration.gather(FlockingRules.of({ ...rules, population: 1 }), sky, Seed.of(1));
    const bird = m.starlings[0]!;
    const falcon = bird.position.plus(Vector2.of(20, 0));
    const fled = m.sightFalcon(falcon).advance(bruteForceIndexer).starlings[0]!;
    const calm = m.advance(bruteForceIndexer).starlings[0]!;
    expect(fled.velocity.x).toBeLessThan(calm.velocity.x);
  });

  it("is perfectly polarised when every bird flies the same way", () => {
    const m = gather();
    expect(m.polarisation().value).toBeLessThan(0.2);
    // A flock with no neighbours to disagree with keeps its heading.
    const lone = Murmuration.gather(FlockingRules.of({ ...rules, population: 1 }), sky, Seed.of(3));
    expect(lone.polarisation().value).toBeCloseTo(1);
  });
});

describe("value objects", () => {
  it("reject impossible states", () => {
    expect(() => Perception.of({ neighbours: 0, personalSpace: 18, falconAlertRadius: 130 })).toThrow(
      InvariantViolation,
    );
    expect(() => FlockingRules.of({ ...rules, population: -1 })).toThrow(InvariantViolation);
  });

  it("wrap positions around a toroidal sky", () => {
    expect(sky.wrap(Vector2.of(-5, 610))).toEqual(Vector2.of(795, 10));
  });

  it("draw reproducible randomness from a seed", () => {
    const [a] = Seed.of(99).next();
    const [b] = Seed.of(99).next();
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });
});
