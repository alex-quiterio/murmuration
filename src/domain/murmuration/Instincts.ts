import { requireNonNegative } from "./invariants";

/**
 * How strongly each urge pulls on a starling. Reynolds' three rules plus
 * the fourth that real starlings live by: get away from the falcon.
 */
export class Instincts {
  private constructor(
    readonly separation: number,
    readonly alignment: number,
    readonly cohesion: number,
    readonly evasion: number,
  ) {}

  static of(props: { separation: number; alignment: number; cohesion: number; evasion: number }): Instincts {
    return new Instincts(
      requireNonNegative("separation", props.separation),
      requireNonNegative("alignment", props.alignment),
      requireNonNegative("cohesion", props.cohesion),
      requireNonNegative("evasion", props.evasion),
    );
  }
}
