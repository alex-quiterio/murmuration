/**
 * A pure source of randomness.
 *
 * The domain never calls `Math.random()`: chance is a value that is passed in
 * and handed back. Drawing a number returns that number *and the next seed*,
 * so the same seed always produces the same flock — the whole simulation is
 * deterministic and replayable.
 *
 * The generator is Mulberry32: tiny, fast, and statistically fine for visuals.
 */
export class Seed {
  private constructor(private readonly state: number) {}

  static of(value: number): Seed {
    return new Seed(value >>> 0);
  }

  /** A number in [0, 1), and the seed to use next. */
  next(): readonly [number, Seed] {
    const state = (this.state + 0x6d2b79f5) | 0;
    let r = Math.imul(state ^ (state >>> 15), 1 | state);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    return [value, new Seed(state)];
  }

  /** A number in [min, max), and the seed to use next. */
  between(min: number, max: number): readonly [number, Seed] {
    const [unit, seed] = this.next();
    return [min + unit * (max - min), seed];
  }

  /** A uniformly random angle in radians, and the seed to use next. */
  angle(): readonly [number, Seed] {
    return this.between(0, Math.PI * 2);
  }
}
