import { SpatialHash } from "./spatialHash";
import type { Boid, Mouse, SimConfig, SimStats } from "./types";

export const DEFAULT_CONFIG: SimConfig = {
  count: 600,
  k: 7,
  sepWeight: 1.5,
  aliWeight: 1.0,
  cohWeight: 1.0,
  predWeight: 8,
  maxSpeed: 3.5,
  minSpeed: 1.6,
  maxForce: 0.18,
  separationRadius: 18,
  predatorRadius: 130,
  trail: 0.12,
};

/**
 * The simulation owns the boid array and the spatial hash. It exposes step()
 * and render() so the React layer can drive the loop without owning the data
 * (storing 600 boids in React state would re-render the world every frame —
 * a hard no).
 *
 * The implementation is mostly classical Reynolds, with one important deviation:
 * neighbour selection is **topological** (k-NN) rather than metric (within a
 * fixed radius). Ballerini et al. (PNAS 2008) measured real Roman starling
 * flocks with stereoscopic photography and found each bird tracks ~7 nearest
 * neighbours regardless of distance. This is what keeps real murmurations
 * cohesive when density changes — and what makes the simulation actually
 * look like a murmuration instead of a swarm of gnats.
 */
export class Simulation {
  boids: Boid[] = [];
  config: SimConfig;
  mouse: Mouse = { x: -1e6, y: -1e6, active: false };
  width = 0;
  height = 0;

  private readonly grid = new SpatialHash(35);
  private readonly scratch: Array<Boid | number> = [];

  constructor(config: SimConfig = { ...DEFAULT_CONFIG }) {
    this.config = config;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  spawn(count: number): void {
    this.boids = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      this.boids.push({
        x: Math.random() * Math.max(this.width, 1),
        y: Math.random() * Math.max(this.height, 1),
        vx: Math.cos(a) * this.config.maxSpeed,
        vy: Math.sin(a) * this.config.maxSpeed,
        ax: 0,
        ay: 0,
      });
    }
  }

  /** Reconcile actual boid count with config.count without resetting survivors. */
  private syncPopulation(): void {
    const target = Math.round(this.config.count);
    while (this.boids.length < target) {
      const a = Math.random() * Math.PI * 2;
      this.boids.push({
        x: Math.random() * Math.max(this.width, 1),
        y: Math.random() * Math.max(this.height, 1),
        vx: Math.cos(a) * this.config.maxSpeed,
        vy: Math.sin(a) * this.config.maxSpeed,
        ax: 0,
        ay: 0,
      });
    }
    if (this.boids.length > target) this.boids.length = target;
  }

  scatter(): void {
    const s = this.config.maxSpeed * 1.5;
    for (const b of this.boids) {
      const a = Math.random() * Math.PI * 2;
      b.vx = Math.cos(a) * s;
      b.vy = Math.sin(a) * s;
    }
  }

  /** Vicsek order parameter: magnitude of the average heading unit vector. */
  orderParameter(): number {
    if (this.boids.length === 0) return 0;
    let sx = 0;
    let sy = 0;
    for (const b of this.boids) {
      const s = Math.hypot(b.vx, b.vy) || 1;
      sx += b.vx / s;
      sy += b.vy / s;
    }
    return Math.hypot(sx, sy) / this.boids.length;
  }

  /** One physics tick. Independent of rendering. */
  step(): void {
    this.syncPopulation();
    this.grid.rebuild(this.boids);

    const cfg = this.config;
    const sepR2 = cfg.separationRadius * cfg.separationRadius;
    const predR = cfg.predatorRadius;
    const predR2 = predR * predR;
    const mouse = this.mouse;

    // ---- compute forces (read-only over boids) ----
    for (const self of this.boids) {
      const n = this.grid.kNearest(self, cfg.k, this.scratch);

      let sepX = 0;
      let sepY = 0;
      let sepCount = 0;
      let aliX = 0;
      let aliY = 0;
      let cohX = 0;
      let cohY = 0;

      for (let i = 0; i < n; i++) {
        const other = this.scratch[i * 2] as Boid;
        const d2 = this.scratch[i * 2 + 1] as number;

        // (1) Separation — only neighbours that are uncomfortably close push us.
        if (d2 < sepR2 && d2 > 1e-4) {
          const d = Math.sqrt(d2);
          sepX += (self.x - other.x) / d;
          sepY += (self.y - other.y) / d;
          sepCount++;
        }
        // (2) Alignment & (3) Cohesion accumulate over all k neighbours.
        aliX += other.vx;
        aliY += other.vy;
        cohX += other.x;
        cohY += other.y;
      }

      let ax = 0;
      let ay = 0;

      if (sepCount > 0) {
        ax += (sepX / sepCount) * cfg.sepWeight;
        ay += (sepY / sepCount) * cfg.sepWeight;
      }

      if (n > 0) {
        // Alignment: steer the velocity toward the neighbourhood's mean heading.
        const aMag = Math.hypot(aliX, aliY);
        if (aMag > 1e-3) {
          const ux = (aliX / aMag) * cfg.maxSpeed - self.vx;
          const uy = (aliY / aMag) * cfg.maxSpeed - self.vy;
          ax += ux * cfg.aliWeight * 0.05;
          ay += uy * cfg.aliWeight * 0.05;
        }
        // Cohesion: steer toward the centroid.
        const dcx = cohX / n - self.x;
        const dcy = cohY / n - self.y;
        const cMag = Math.hypot(dcx, dcy);
        if (cMag > 1e-3) {
          ax += (dcx / cMag) * cfg.cohWeight * 0.05;
          ay += (dcy / cMag) * cfg.cohWeight * 0.05;
        }
      }

      // (4) Predator — inverse-distance flee, ramped to 0 at predatorRadius.
      if (mouse.active) {
        const dx = self.x - mouse.x;
        const dy = self.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < predR2 && d2 > 1e-2) {
          const d = Math.sqrt(d2);
          const force = 1 - d / predR;
          ax += (dx / d) * force * cfg.predWeight * 0.1;
          ay += (dy / d) * force * cfg.predWeight * 0.1;
        }
      }

      // Clamp net acceleration. Without this, strong predator forces produce
      // visible snap-turns that read as "glitchy" instead of "panicked".
      const am = Math.hypot(ax, ay);
      if (am > cfg.maxForce) {
        ax = (ax / am) * cfg.maxForce;
        ay = (ay / am) * cfg.maxForce;
      }
      self.ax = ax;
      self.ay = ay;
    }

    // ---- integrate (write phase) ----
    const w = this.width;
    const h = this.height;
    for (const b of this.boids) {
      b.vx += b.ax;
      b.vy += b.ay;

      // Speed envelope. Real starlings cruise around 20 m/s and can't hover.
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > cfg.maxSpeed) {
        b.vx = (b.vx / sp) * cfg.maxSpeed;
        b.vy = (b.vy / sp) * cfg.maxSpeed;
      } else if (sp < cfg.minSpeed) {
        const s = sp < 0.01 ? 1 : sp;
        b.vx = (b.vx / s) * cfg.minSpeed;
        b.vy = (b.vy / s) * cfg.minSpeed;
      }

      b.x += b.vx;
      b.y += b.vy;

      // Toroidal world — the canvas wraps. Real flocks have soft boundaries
      // (the roost they're returning to), but the toroidal version reads as a
      // continuous infinite sky which is what we want visually.
      if (b.x < 0) b.x += w;
      else if (b.x > w) b.x -= w;
      if (b.y < 0) b.y += h;
      else if (b.y > h) b.y -= h;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const cfg = this.config;

    // Motion trails: paint a translucent background over the previous frame
    // instead of clearing. The longer the trail, the lower the alpha.
    ctx.fillStyle = `rgba(11, 13, 31, ${cfg.trail})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Each boid is a tiny triangle pointing along its velocity.
    // We inline the rotation maths to avoid ctx.save/restore overhead per boid.
    ctx.fillStyle = "#e8e8ee";
    for (const b of this.boids) {
      const a = Math.atan2(b.vy, b.vx);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const x = b.x;
      const y = b.y;
      ctx.beginPath();
      ctx.moveTo(x + cos * 4, y + sin * 4);
      ctx.lineTo(x - cos * 3 + sin * 2, y - sin * 3 - cos * 2);
      ctx.lineTo(x - cos * 3 - sin * 2, y - sin * 3 + cos * 2);
      ctx.closePath();
      ctx.fill();
    }

    // Predator hint ring — gives the user feedback that the cursor is being read.
    if (this.mouse.active) {
      ctx.strokeStyle = "rgba(255, 122, 89, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, cfg.predatorRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /** Caller-provided sample interval (ms). Used by the React stats panel. */
  sampleStats(fps: number): SimStats {
    return {
      fps,
      count: this.boids.length,
      order: this.orderParameter(),
    };
  }
}
