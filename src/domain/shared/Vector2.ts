/**
 * Immutable 2D vector — the basic value object of the sky.
 *
 * Every operation returns a new vector; nothing is ever mutated. Two vectors
 * are equal when their components are equal (value semantics, no identity).
 */
export class Vector2 {
  static readonly ZERO = new Vector2(0, 0);

  private constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  static of(x: number, y: number): Vector2 {
    return new Vector2(x, y);
  }

  /** A vector of the given length pointing at `radians` (0 = east, clockwise on screen). */
  static fromAngle(radians: number, length = 1): Vector2 {
    return new Vector2(Math.cos(radians) * length, Math.sin(radians) * length);
  }

  plus(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  minus(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  times(factor: number): Vector2 {
    return new Vector2(this.x * factor, this.y * factor);
  }

  dividedBy(divisor: number): Vector2 {
    return new Vector2(this.x / divisor, this.y / divisor);
  }

  get length(): number {
    return Math.hypot(this.x, this.y);
  }

  get lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /** Angle in radians, as `Math.atan2(y, x)`. */
  get angle(): number {
    return Math.atan2(this.y, this.x);
  }

  distanceSquaredTo(other: Vector2): number {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    return dx * dx + dy * dy;
  }

  /** Unit vector in the same direction, or ZERO for the zero vector. */
  direction(): Vector2 {
    const l = this.length;
    return l === 0 ? Vector2.ZERO : this.dividedBy(l);
  }

  withLength(length: number): Vector2 {
    return this.direction().times(length);
  }

  /** Same direction, length capped at `max`. */
  limitedTo(max: number): Vector2 {
    return this.length > max ? this.withLength(max) : this;
  }

  equals(other: Vector2): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
