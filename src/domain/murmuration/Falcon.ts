import { Vector2 } from "@domain/shared/Vector2";

/**
 * The predator. Either circling somewhere in the sky, or nowhere to be seen.
 */
export class Falcon {
  static readonly ABSENT = new Falcon(null);

  private constructor(readonly position: Vector2 | null) {}

  static at(position: Vector2): Falcon {
    return new Falcon(position);
  }

  isPresent(): this is Falcon & { readonly position: Vector2 } {
    return this.position !== null;
  }
}
