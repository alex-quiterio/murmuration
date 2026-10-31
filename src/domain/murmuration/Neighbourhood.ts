import type { Starling } from "./Starling";

export interface Neighbour {
  readonly starling: Starling;
  readonly distanceSquared: number;
}

/** The k flockmates a starling is watching, nearest first. */
export type Neighbourhood = readonly Neighbour[];

/** A frozen picture of the flock that can answer "who is nearest to whom?". */
export interface NeighbourhoodIndex {
  nearest(to: Starling, count: number): Neighbourhood;
}

/**
 * Domain port. How neighbours are found (brute force, spatial hash, k-d tree…)
 * is a technical choice that lives outside the domain; the domain only
 * requires that the answer is the topological k-nearest neighbourhood.
 */
export interface NeighbourhoodIndexer {
  index(starlings: readonly Starling[]): NeighbourhoodIndex;
}

/**
 * Reference implementation, O(n²). Correct by inspection — useful as the
 * specification other indexers are measured against.
 */
export const bruteForceIndexer: NeighbourhoodIndexer = {
  index: (starlings) => ({
    nearest: (to, count) =>
      starlings
        .filter((other) => !other.is(to))
        .map((starling) => ({ starling, distanceSquared: to.position.distanceSquaredTo(starling.position) }))
        .sort((a, b) => a.distanceSquared - b.distanceSquared)
        .slice(0, count),
  }),
};
