import { Vector2 } from "@domain/shared/Vector2";
import type { FlightEnvelope } from "./FlightEnvelope";
import type { Sky } from "./Sky";

declare const starlingIdBrand: unique symbol;
/** Identity of a starling — stable across every tick of its life. */
export type StarlingId = number & { readonly [starlingIdBrand]: true };

export const StarlingId = {
  of: (value: number): StarlingId => value as StarlingId,
};

/**
 * A single bird — an entity: it keeps its identity while its position and
 * velocity change. Immutable: flying returns the same bird, a moment later.
 */
export class Starling {
  private constructor(
    readonly id: StarlingId,
    readonly position: Vector2,
    readonly velocity: Vector2,
  ) {}

  static hatch(id: StarlingId, position: Vector2, velocity: Vector2): Starling {
    return new Starling(id, position, velocity);
  }

  /** Unit vector of the direction of flight. */
  get heading(): Vector2 {
    return this.velocity.direction();
  }

  /**
   * One wingbeat: apply steering, stay inside the flight envelope, move, and
   * let the sky wrap us around its edges.
   */
  fly(steering: Vector2, envelope: FlightEnvelope, sky: Sky): Starling {
    const velocity = envelope.constrainSpeed(this.velocity.plus(steering));
    return new Starling(this.id, sky.wrap(this.position.plus(velocity)), velocity);
  }

  /** Startled: abruptly take off in a new direction. */
  startle(velocity: Vector2): Starling {
    return new Starling(this.id, this.position, velocity);
  }

  is(other: Starling): boolean {
    return this.id === other.id;
  }
}
