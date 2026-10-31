import { Seed } from "@domain/shared/Seed";
import { Vector2 } from "@domain/shared/Vector2";

/**
 * The sky the flock flies in: a toroidal rectangle.
 *
 * Real flocks have soft boundaries (the roost they return to), but a sky that
 * wraps reads as one continuous, endless evening — which is what we want.
 */
export class Sky {
  private constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  /** Dimensions are floored at 1 so a sky always has somewhere to put a bird. */
  static of(width: number, height: number): Sky {
    return new Sky(Math.max(width, 1), Math.max(height, 1));
  }

  /** Fly off one edge, reappear on the opposite one. */
  wrap(position: Vector2): Vector2 {
    let { x, y } = position;
    if (x < 0) x += this.width;
    else if (x > this.width) x -= this.width;
    if (y < 0) y += this.height;
    else if (y > this.height) y -= this.height;
    return x === position.x && y === position.y ? position : Vector2.of(x, y);
  }

  randomPoint(seed: Seed): readonly [Vector2, Seed] {
    const [x, s1] = seed.between(0, this.width);
    const [y, s2] = s1.between(0, this.height);
    return [Vector2.of(x, y), s2];
  }

  equals(other: Sky): boolean {
    return this.width === other.width && this.height === other.height;
  }
}
