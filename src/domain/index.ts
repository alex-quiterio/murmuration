/**
 * Public surface of the Murmuration bounded context.
 *
 * Pure TypeScript: no DOM, no framework, no clock, no Math.random.
 * Outer layers import from here, never from files inside the domain.
 */
export { Seed } from "./shared/Seed";
export { Vector2 } from "./shared/Vector2";

export { Falcon } from "./murmuration/Falcon";
export { FlightEnvelope } from "./murmuration/FlightEnvelope";
export { FlockingRules } from "./murmuration/FlockingRules";
export { Instincts } from "./murmuration/Instincts";
export { InvariantViolation } from "./murmuration/invariants";
export { Murmuration } from "./murmuration/Murmuration";
export {
  bruteForceIndexer,
  type Neighbour,
  type Neighbourhood,
  type NeighbourhoodIndex,
  type NeighbourhoodIndexer,
} from "./murmuration/Neighbourhood";
export { Perception } from "./murmuration/Perception";
export { Polarisation } from "./murmuration/Polarisation";
export { Sky } from "./murmuration/Sky";
export { Starling, StarlingId } from "./murmuration/Starling";
export * as Steering from "./murmuration/steering";
