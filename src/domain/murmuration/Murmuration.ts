import { Seed } from "@domain/shared/Seed";
import { Vector2 } from "@domain/shared/Vector2";
import { Falcon } from "./Falcon";
import type { FlockingRules } from "./FlockingRules";
import type { NeighbourhoodIndexer } from "./Neighbourhood";
import { Polarisation } from "./Polarisation";
import type { Sky } from "./Sky";
import { Starling, StarlingId } from "./Starling";
import { steer } from "./steering";

/** Startled birds burst away faster than they can sustain. */
const SCATTER_BURST = 1.5;

interface State {
  readonly starlings: readonly Starling[];
  readonly rules: FlockingRules;
  readonly sky: Sky;
  readonly falcon: Falcon;
  readonly seed: Seed;
  readonly nextId: number;
}

/**
 * Aggregate root: a flock of starlings in a sky, under a set of rules,
 * possibly watched by a falcon.
 *
 * Fully immutable and deterministic. Every behaviour returns a new
 * Murmuration; randomness comes from the Seed it carries, so the same
 * history of commands always yields the same flock.
 *
 * Invariant: the number of starlings always equals `rules.population`.
 */
export class Murmuration {
  private constructor(private readonly state: State) {}

  /** A new murmuration, its birds scattered at random across the sky. */
  static gather(rules: FlockingRules, sky: Sky, seed: Seed): Murmuration {
    const empty = new Murmuration({ starlings: [], rules, sky, falcon: Falcon.ABSENT, seed, nextId: 1 });
    return empty.hatch(rules.population);
  }

  get starlings(): readonly Starling[] {
    return this.state.starlings;
  }
  get rules(): FlockingRules {
    return this.state.rules;
  }
  get sky(): Sky {
    return this.state.sky;
  }
  get falcon(): Falcon {
    return this.state.falcon;
  }
  get population(): number {
    return this.state.starlings.length;
  }

  polarisation(): Polarisation {
    return Polarisation.of(this.state.starlings);
  }

  /**
   * One tick. Every starling decides from the same frozen snapshot of the
   * flock, then all of them fly at once.
   */
  advance(indexer: NeighbourhoodIndexer): Murmuration {
    const { starlings, rules, sky, falcon } = this.state;
    const index = indexer.index(starlings);
    const k = rules.perception.neighbours;
    return this.with({
      starlings: starlings.map((s) => s.fly(steer(s, index.nearest(s, k), falcon, rules), rules.envelope, sky)),
    });
  }

  /** Start over: the same rules, a fresh flock. */
  regather(): Murmuration {
    return Murmuration.gather(this.state.rules, this.state.sky, this.state.seed).with({
      falcon: this.state.falcon,
    });
  }

  /** Every bird bolts in a random direction. */
  scatter(): Murmuration {
    let seed = this.state.seed;
    const burst = this.state.rules.envelope.topSpeed * SCATTER_BURST;
    const starlings = this.state.starlings.map((s) => {
      const [angle, next] = seed.angle();
      seed = next;
      return s.startle(Vector2.fromAngle(angle, burst));
    });
    return this.with({ starlings, seed });
  }

  /**
   * Adopt new rules. Survivors keep flying; the flock grows by hatching
   * newcomers or shrinks by releasing the most recently hatched.
   */
  adopt(rules: FlockingRules): Murmuration {
    const adopted = this.with({ rules });
    const shortfall = rules.population - this.population;
    if (shortfall > 0) return adopted.hatch(shortfall);
    if (shortfall < 0) return adopted.with({ starlings: this.state.starlings.slice(0, rules.population) });
    return adopted;
  }

  /** The sky changed shape (e.g. the viewport resized). */
  spanSky(sky: Sky): Murmuration {
    return sky.equals(this.state.sky) ? this : this.with({ sky });
  }

  sightFalcon(position: Vector2): Murmuration {
    return this.with({ falcon: Falcon.at(position) });
  }

  loseFalcon(): Murmuration {
    return this.state.falcon.isPresent() ? this.with({ falcon: Falcon.ABSENT }) : this;
  }

  private hatch(count: number): Murmuration {
    const { sky, rules } = this.state;
    let { seed, nextId } = this.state;
    const hatchlings: Starling[] = [];
    for (let i = 0; i < count; i++) {
      const [position, s1] = sky.randomPoint(seed);
      const [angle, s2] = s1.angle();
      seed = s2;
      hatchlings.push(
        Starling.hatch(StarlingId.of(nextId++), position, Vector2.fromAngle(angle, rules.envelope.topSpeed)),
      );
    }
    return this.with({ starlings: [...this.state.starlings, ...hatchlings], seed, nextId });
  }

  private with(changes: Partial<State>): Murmuration {
    return new Murmuration({ ...this.state, ...changes });
  }
}
