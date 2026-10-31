import { FlightEnvelope, FlockingRules, Instincts, type Murmuration, Perception } from "@domain";
import type { FlockMetrics, MurmurationView, Tuning } from "./dto";

export function toTuning(rules: FlockingRules): Tuning {
  const { perception, instincts, envelope } = rules;
  return {
    population: rules.population,
    neighbours: perception.neighbours,
    personalSpace: perception.personalSpace,
    falconAlertRadius: perception.falconAlertRadius,
    separation: instincts.separation,
    alignment: instincts.alignment,
    cohesion: instincts.cohesion,
    evasion: instincts.evasion,
    stallSpeed: envelope.stallSpeed,
    topSpeed: envelope.topSpeed,
    maxSteering: envelope.maxSteering,
  };
}

export function toRules(t: Tuning): FlockingRules {
  return FlockingRules.of({
    population: t.population,
    perception: Perception.of({
      neighbours: t.neighbours,
      personalSpace: t.personalSpace,
      falconAlertRadius: t.falconAlertRadius,
    }),
    instincts: Instincts.of({
      separation: t.separation,
      alignment: t.alignment,
      cohesion: t.cohesion,
      evasion: t.evasion,
    }),
    envelope: FlightEnvelope.of({ stallSpeed: t.stallSpeed, topSpeed: t.topSpeed, maxSteering: t.maxSteering }),
  });
}

export function toView(m: Murmuration): MurmurationView {
  const falcon = m.falcon;
  return {
    width: m.sky.width,
    height: m.sky.height,
    starlings: m.starlings.map((s) => ({ x: s.position.x, y: s.position.y, heading: s.velocity.angle })),
    falcon: falcon.isPresent()
      ? { x: falcon.position.x, y: falcon.position.y, alertRadius: m.rules.perception.falconAlertRadius }
      : null,
  };
}

export function toMetrics(m: Murmuration): FlockMetrics {
  return { population: m.population, polarisation: m.polarisation().value };
}
