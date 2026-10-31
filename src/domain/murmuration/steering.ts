import { Vector2 } from "@domain/shared/Vector2";
import type { Falcon } from "./Falcon";
import type { FlockingRules } from "./FlockingRules";
import type { Neighbourhood } from "./Neighbourhood";
import type { Starling } from "./Starling";

/*
 * Domain service: how a starling decides where to steer.
 *
 * Each urge is a pure function of the bird, what it perceives, and the rules.
 * `steer` weighs them by instinct and caps the result by the flight envelope.
 */

const ALIGNMENT_GAIN = 0.05;
const COHESION_GAIN = 0.05;
const EVASION_GAIN = 0.1;

/** Push away from flockmates inside personal space (mean of unit vectors). */
export function separation(self: Starling, neighbourhood: Neighbourhood, personalSpace: number): Vector2 {
  const limit = personalSpace * personalSpace;
  let push = Vector2.ZERO;
  let crowding = 0;
  for (const { starling: other, distanceSquared } of neighbourhood) {
    if (distanceSquared >= limit || distanceSquared <= 1e-4) continue;
    push = push.plus(self.position.minus(other.position).dividedBy(Math.sqrt(distanceSquared)));
    crowding++;
  }
  return crowding === 0 ? Vector2.ZERO : push.dividedBy(crowding);
}

/** Steer toward the neighbourhood's mean heading, flown at top speed. */
export function alignment(self: Starling, neighbourhood: Neighbourhood, topSpeed: number): Vector2 {
  if (neighbourhood.length === 0) return Vector2.ZERO;
  const flow = neighbourhood.reduce((sum, n) => sum.plus(n.starling.velocity), Vector2.ZERO);
  if (flow.length <= 1e-3) return Vector2.ZERO;
  return flow.withLength(topSpeed).minus(self.velocity);
}

/** Steer toward the neighbourhood's centroid — direction only, so density doesn't matter. */
export function cohesion(self: Starling, neighbourhood: Neighbourhood): Vector2 {
  if (neighbourhood.length === 0) return Vector2.ZERO;
  const centroid = neighbourhood
    .reduce((sum, n) => sum.plus(n.starling.position), Vector2.ZERO)
    .dividedBy(neighbourhood.length);
  const towards = centroid.minus(self.position);
  return towards.length <= 1e-3 ? Vector2.ZERO : towards.direction();
}

/** Flee the falcon; strongest up close, fading to nothing at the alert radius. */
export function evasion(self: Starling, falcon: Falcon, alertRadius: number): Vector2 {
  if (!falcon.isPresent()) return Vector2.ZERO;
  const away = self.position.minus(falcon.position);
  const d2 = away.lengthSquared;
  if (d2 >= alertRadius * alertRadius || d2 <= 1e-2) return Vector2.ZERO;
  const distance = Math.sqrt(d2);
  return away.dividedBy(distance).times(1 - distance / alertRadius);
}

/** The net steering a starling applies this wingbeat. */
export function steer(self: Starling, neighbourhood: Neighbourhood, falcon: Falcon, rules: FlockingRules): Vector2 {
  const { instincts, perception, envelope } = rules;
  const urge = separation(self, neighbourhood, perception.personalSpace)
    .times(instincts.separation)
    .plus(alignment(self, neighbourhood, envelope.topSpeed).times(instincts.alignment * ALIGNMENT_GAIN))
    .plus(cohesion(self, neighbourhood).times(instincts.cohesion * COHESION_GAIN))
    .plus(evasion(self, falcon, perception.falconAlertRadius).times(instincts.evasion * EVASION_GAIN));
  return envelope.constrainSteering(urge);
}
