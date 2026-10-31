import { FlightEnvelope } from "./FlightEnvelope";
import { Instincts } from "./Instincts";
import { requireWholeCount } from "./invariants";
import { Perception } from "./Perception";

/**
 * Everything that governs how a murmuration behaves: how many birds, what
 * they perceive, what they feel, and what their bodies allow.
 */
export class FlockingRules {
  private constructor(
    readonly population: number,
    readonly perception: Perception,
    readonly instincts: Instincts,
    readonly envelope: FlightEnvelope,
  ) {}

  static of(props: {
    population: number;
    perception: Perception;
    instincts: Instincts;
    envelope: FlightEnvelope;
  }): FlockingRules {
    return new FlockingRules(
      requireWholeCount("population", props.population),
      props.perception,
      props.instincts,
      props.envelope,
    );
  }

  /** Values tuned to look like a winter roost over Rome. */
  static starlingDefaults(): FlockingRules {
    return FlockingRules.of({
      population: 600,
      perception: Perception.of({ neighbours: 7, personalSpace: 18, falconAlertRadius: 130 }),
      instincts: Instincts.of({ separation: 1.5, alignment: 1.0, cohesion: 1.0, evasion: 8 }),
      envelope: FlightEnvelope.of({ stallSpeed: 1.6, topSpeed: 3.5, maxSteering: 0.18 }),
    });
  }
}
