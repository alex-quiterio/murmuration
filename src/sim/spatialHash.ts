import type { Boid } from "./types";

/**
 * Spatial hash grid for neighbour queries.
 *
 * Without this, each frame is O(n²) (for n=600 that's 360k pair checks every
 * 16ms). With a grid sized ~1.5× the search radius, average work per query
 * drops to O(k) and the whole step becomes O(n).
 *
 * We use an integer hash key instead of a string key — a Map of numbers is
 * ~2× faster than a Map of strings in V8 for this access pattern.
 */
export class SpatialHash {
  readonly cellSize: number;
  private readonly grid = new Map<number, Boid[]>();

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private static key(cx: number, cy: number): number {
    // Standard two-prime hash. Collisions are fine — we re-check distance later.
    // The XOR-of-products pattern is what Teschner et al. (2003) recommend.
    return (cx * 73856093) ^ (cy * 19349663);
  }

  rebuild(boids: readonly Boid[]): void {
    this.grid.clear();
    const cs = this.cellSize;
    for (const b of boids) {
      const cx = Math.floor(b.x / cs);
      const cy = Math.floor(b.y / cs);
      const k = SpatialHash.key(cx, cy);
      const bucket = this.grid.get(k);
      if (bucket) bucket.push(b);
      else this.grid.set(k, [b]);
    }
  }

  /**
   * Fill `out` with up to k nearest neighbours of `self`, interleaved as
   * (boid, d²) pairs. Returns the number of neighbours found.
   *
   * We grow the search outward ring by ring until we have enough candidates,
   * then do a partial selection sort over the squared distances. This is
   * faster than getting all candidates and full-sorting them, especially
   * when the flock is sparse.
   *
   * The `out` array is reused across calls to avoid allocating each frame.
   */
  kNearest(self: Boid, k: number, out: Array<Boid | number>): number {
    const cs = this.cellSize;
    const cx = Math.floor(self.x / cs);
    const cy = Math.floor(self.y / cs);
    out.length = 0;

    let radius = 1;
    while (out.length < k * 2 && radius <= 6) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // On radii > 1, skip cells we already scanned (interior of the ring).
          if (radius > 1 && Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const bucket = this.grid.get(SpatialHash.key(cx + dx, cy + dy));
          if (!bucket) continue;
          for (const other of bucket) {
            if (other === self) continue;
            const ddx = other.x - self.x;
            const ddy = other.y - self.y;
            out.push(other, ddx * ddx + ddy * ddy);
          }
        }
      }
      radius++;
    }

    // Partial selection sort: pick the k smallest by d². O(n·k) but k is small.
    const total = out.length >> 1;
    const take = Math.min(k, total);
    for (let i = 0; i < take; i++) {
      let minJ = i;
      let minD = out[i * 2 + 1] as number;
      for (let j = i + 1; j < total; j++) {
        const d = out[j * 2 + 1] as number;
        if (d < minD) {
          minD = d;
          minJ = j;
        }
      }
      if (minJ !== i) {
        const tb = out[i * 2];
        const td = out[i * 2 + 1];
        out[i * 2] = out[minJ * 2];
        out[i * 2 + 1] = out[minJ * 2 + 1];
        out[minJ * 2] = tb;
        out[minJ * 2 + 1] = td;
      }
    }
    return take;
  }
}
