import { Vector2 } from "@domain/shared/Vector2";
import { requireNonNegative, requirePositive } from "./invariants";

/**
 * What a starling's body allows: it cannot hover (stall speed), cannot exceed
 * its top speed, and cannot turn harder than its wings allow (max steering).
 */
export class FlightEnvelope {
  private constructor(
    readonly stallSpeed: number,
    readonly topSpeed: number,
    readonly maxSteering: number,
  ) {}

  static of(props: { stallSpeed: number; topSpeed: number; maxSteering: number }): FlightEnvelope {
    return new FlightEnvelope(
      requireNonNegative("stallSpeed", props.stallSpeed),
      requirePositive("topSpeed", props.topSpeed),
      requireNonNegative("maxSteering", props.maxSteering),
    );
  }

  /**
   * Keep a velocity inside the envelope. A starling is never forced to fly
   * faster than its top speed, even if the stall speed is set above it.
   */
  constrainSpeed(velocity: Vector2): Vector2 {
    const speed = velocity.length;
    const floor = Math.min(this.stallSpeed, this.topSpeed);
    if (speed > this.topSpeed) return velocity.withLength(this.topSpeed);
    if (speed < floor) {
      // Near-zero velocities have no meaningful direction; nudge them instead.
      return speed < 0.01 ? velocity.times(floor) : velocity.withLength(floor);
    }
    return velocity;
  }

  /**
   * Cap the net steering force. Without this, a strong falcon produces
   * snap-turns that read as "glitchy" rather than "panicked".
   */
  constrainSteering(steering: Vector2): Vector2 {
    return steering.limitedTo(this.maxSteering);
  }
}
