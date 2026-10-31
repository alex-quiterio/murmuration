import { requirePositive, requireWholeCount } from "./invariants";

/**
 * How a starling perceives the world around it.
 *
 * `neighbours` is the heart of the model: each bird tracks a fixed *number*
 * of nearest flockmates (topological), not everyone within a fixed distance
 * (metric). Ballerini et al. (PNAS 2008) measured ~7 in real Roman starlings.
 */
export class Perception {
  private constructor(
    /** k — how many nearest flockmates each starling watches. */
    readonly neighbours: number,
    /** Distance under which a flockmate is too close for comfort. */
    readonly personalSpace: number,
    /** Distance at which a starling notices the falcon. */
    readonly falconAlertRadius: number,
  ) {}

  static of(props: { neighbours: number; personalSpace: number; falconAlertRadius: number }): Perception {
    return new Perception(
      requireWholeCount("neighbours", props.neighbours, 1),
      requirePositive("personalSpace", props.personalSpace),
      requirePositive("falconAlertRadius", props.falconAlertRadius),
    );
  }
}
