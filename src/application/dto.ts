/*
 * Data transfer objects: the flat, framework-friendly shapes the outside
 * world sees. Nothing outside the application layer touches domain objects.
 */

/** Every tunable rule, flattened for sliders and forms. */
export interface Tuning {
  population: number;
  neighbours: number;
  personalSpace: number;
  falconAlertRadius: number;
  separation: number;
  alignment: number;
  cohesion: number;
  evasion: number;
  stallSpeed: number;
  topSpeed: number;
  maxSteering: number;
}

export interface StarlingView {
  readonly x: number;
  readonly y: number;
  /** Direction of flight in radians. */
  readonly heading: number;
}

export interface FalconView {
  readonly x: number;
  readonly y: number;
  readonly alertRadius: number;
}

/** Read model for rendering one frame. */
export interface MurmurationView {
  readonly width: number;
  readonly height: number;
  readonly starlings: readonly StarlingView[];
  readonly falcon: FalconView | null;
}

/** Read model for the stats panel. */
export interface FlockMetrics {
  readonly population: number;
  /** Vicsek order parameter λ ∈ [0, 1]. */
  readonly polarisation: number;
}
