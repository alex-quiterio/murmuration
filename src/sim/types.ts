/**
 * A single bird in the flock.
 *
 * Stored as a plain mutable object — we update these 60×/sec, so allocating new
 * objects on every step would crush GC. Plain object property access also
 * beats Float32Array for this size of working set in V8.
 */
export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
}

/**
 * Tunable parameters. Held in a mutable ref shared between React UI and the
 * simulation loop — sliders mutate this in place so the loop sees changes on
 * the next frame without restarting.
 */
export interface SimConfig {
  /** Target population. The loop spawns/culls to match. */
  count: number;
  /** Number of nearest neighbours each bird tracks (topological, not metric). */
  k: number;
  /** Force weights — see simulation.ts for what each one does. */
  sepWeight: number;
  aliWeight: number;
  cohWeight: number;
  predWeight: number;
  /** Flight envelope — starlings can't hover and can't go supersonic. */
  maxSpeed: number;
  minSpeed: number;
  /** Per-frame max acceleration. Prevents snap-turns. */
  maxForce: number;
  /** Distance under which separation kicks in. */
  separationRadius: number;
  /** Predator influence radius (cursor as falcon). */
  predatorRadius: number;
  /** Alpha for the per-frame fill that produces motion trails. Higher = shorter trails. */
  trail: number;
}

/**
 * State the React UI cares about — sampled at ~2 Hz, not every frame.
 */
export interface SimStats {
  fps: number;
  count: number;
  /** Vicsek-style order parameter: |⟨v̂⟩|. 1.0 = perfectly aligned, ~0 = chaos. */
  order: number;
}

export interface Mouse {
  x: number;
  y: number;
  active: boolean;
}
