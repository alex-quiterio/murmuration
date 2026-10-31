import type { Neighbour, Neighbourhood, NeighbourhoodIndex, NeighbourhoodIndexer, Starling } from "@domain";

/** Rings searched before giving up on a sparse neighbourhood. */
const MAX_RINGS = 6;

/**
 * Adapter for the domain's NeighbourhoodIndexer port, backed by a spatial
 * hash grid.
 *
 * Brute force is O(n²) per tick (360k pair checks for 600 birds). With a grid
 * sized ~1.5× the typical neighbour distance, each query is ~O(k) and the
 * whole tick is O(n). Mutation is confined to private scratch buffers; from
 * the outside every query is a pure function of the indexed snapshot.
 */
export class SpatialHashIndexer implements NeighbourhoodIndexer {
  constructor(private readonly cellSize = 35) {}

  index(starlings: readonly Starling[]): NeighbourhoodIndex {
    return new SpatialHashIndex(starlings, this.cellSize);
  }
}

class SpatialHashIndex implements NeighbourhoodIndex {
  private readonly cells = new Map<number, Starling[]>();
  private readonly candidates: Starling[] = [];
  private readonly distances: number[] = [];
  private readonly visited = new Set<Starling[]>();

  constructor(
    starlings: readonly Starling[],
    private readonly cellSize: number,
  ) {
    for (const s of starlings) {
      const key = SpatialHashIndex.key(this.cell(s.position.x), this.cell(s.position.y));
      const bucket = this.cells.get(key);
      if (bucket) bucket.push(s);
      else this.cells.set(key, [s]);
    }
  }

  /** Two-prime XOR hash (Teschner et al. 2003). Collisions are harmless — distances are re-checked. */
  private static key(cx: number, cy: number): number {
    return (cx * 73856093) ^ (cy * 19349663);
  }

  private cell(coordinate: number): number {
    return Math.floor(coordinate / this.cellSize);
  }

  /**
   * Grow the search ring by ring. After scanning ring r, every starling within
   * r·cellSize has been seen, so we stop once the k-th closest candidate lies
   * inside that radius — the answer is then exact, not approximate.
   */
  nearest(to: Starling, count: number): Neighbourhood {
    const candidates = this.candidates;
    const distances = this.distances;
    const visited = this.visited;
    candidates.length = 0;
    distances.length = 0;
    visited.clear();

    const cx = this.cell(to.position.x);
    const cy = this.cell(to.position.y);
    for (let ring = 1; ring <= MAX_RINGS; ring++) {
      for (let dx = -ring; dx <= ring; dx++) {
        for (let dy = -ring; dy <= ring; dy++) {
          // Beyond the first ring, skip the interior we already scanned.
          if (ring > 1 && Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
          const bucket = this.cells.get(SpatialHashIndex.key(cx + dx, cy + dy));
          // Distinct cells can hash to the same bucket; scan each bucket once.
          if (!bucket || visited.has(bucket)) continue;
          visited.add(bucket);
          for (const other of bucket) {
            if (other.is(to)) continue;
            candidates.push(other);
            distances.push(to.position.distanceSquaredTo(other.position));
          }
        }
      }
      if (candidates.length >= count) {
        this.selectClosest(count);
        const covered = ring * this.cellSize;
        if (distances[count - 1]! <= covered * covered) break;
      }
    }

    const take = Math.min(count, candidates.length);
    this.selectClosest(take);
    const neighbourhood: Neighbour[] = [];
    for (let i = 0; i < take; i++) {
      neighbourhood.push({ starling: candidates[i]!, distanceSquared: distances[i]! });
    }
    return neighbourhood;
  }

  /** Partial selection sort: move the `take` closest candidates to the front, in order. */
  private selectClosest(take: number): void {
    const { candidates, distances } = this;
    for (let i = 0; i < take; i++) {
      let closest = i;
      for (let j = i + 1; j < candidates.length; j++) {
        if (distances[j]! < distances[closest]!) closest = j;
      }
      if (closest !== i) {
        [candidates[i], candidates[closest]] = [candidates[closest]!, candidates[i]!];
        [distances[i], distances[closest]] = [distances[closest]!, distances[i]!];
      }
    }
  }
}
