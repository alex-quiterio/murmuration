import { Vector2 } from "@domain/shared/Vector2";
import type { Starling } from "./Starling";

/**
 * Vicsek order parameter λ = |⟨v̂⟩| — the magnitude of the flock's mean
 * heading. 1 means every bird flies the same way; ~0 means chaos.
 * Real murmurations sit just below 1.
 */
export class Polarisation {
  private constructor(readonly value: number) {}

  static of(starlings: readonly Starling[]): Polarisation {
    if (starlings.length === 0) return new Polarisation(0);
    const sum = starlings.reduce((acc, s) => acc.plus(s.heading), Vector2.ZERO);
    return new Polarisation(sum.length / starlings.length);
  }
}
