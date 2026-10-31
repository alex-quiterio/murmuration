import type { MurmurationView } from "@application";

/*
 * Palette — dusk over a reedbed, when murmurations happen. Kept in step with
 * the CSS custom properties in styles.css.
 */
const SKY_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, "#34335f"],
  [0.38, "#5a4a7c"],
  [0.62, "#a4677f"],
  [0.8, "#df8a6d"],
  [0.93, "#f2b27a"],
  [1, "#f8d08f"],
];
const SUN = { x: 0.7, y: 0.9, core: "rgba(255, 236, 196, 0.9)", glow: "rgba(255, 190, 120, 0.35)" };
const STARLING_INK = "rgba(14, 10, 22, 0.8)";
const FALCON_INK = "#0b0710";
const FALCON_RING = "rgba(255, 214, 170, 0.18)";

/** Cheap deterministic hash → [0, 1). Gives each bird a stable size and wingbeat phase. */
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * Draws a MurmurationView onto a 2D canvas.
 *
 * The sky (gradient, sun, a few early stars) is pre-rendered once per size.
 * Each frame washes it over the previous frame at `trail` alpha, so moving
 * birds leave fading trails while the sky converges to the static image.
 * Trails, wingbeats and depth are purely visual and live here, not in the domain.
 */
export class CanvasMurmurationRenderer {
  private sky: HTMLCanvasElement | null = null;
  private skyKey = "";
  private frame = 0;
  private falconHeading = -Math.PI / 2;
  private lastFalcon: { x: number; y: number } | null = null;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  draw(view: MurmurationView, trail: number): void {
    const ctx = this.ctx;
    this.frame++;

    ctx.globalAlpha = trail;
    ctx.drawImage(this.skyFor(view.width, view.height), 0, 0, view.width, view.height);
    ctx.globalAlpha = 1;

    // Starlings: swept-wing silhouettes. Each bird is filled on its own so
    // overlapping translucent birds pool darker — the flock's density shows.
    ctx.fillStyle = STARLING_INK;
    const t = this.frame * 0.55;
    view.starlings.forEach(({ x, y, heading }, i) => {
      const h = hash(i);
      const size = 0.75 + h * 0.6; // depth: nearer birds look larger
      const flap = 0.55 + 0.45 * Math.abs(Math.sin(t + h * 20)); // wingbeat
      this.bird(x, y, heading, size, flap);
    });

    this.drawFalcon(view);
  }

  private bird(x: number, y: number, heading: number, size: number, flap: number): void {
    const ctx = this.ctx;
    const c = Math.cos(heading) * size;
    const s = Math.sin(heading) * size;
    const span = 3.6 * flap;
    // Local frame: forward = (c, s), left = (s, -c). A crescent: wings curve
    // back from the shoulders, so motion ghosts blur into a streak.
    const px = (f: number, l: number) => x + c * f + s * l;
    const py = (f: number, l: number) => y + s * f - c * l;
    ctx.beginPath();
    ctx.moveTo(px(2.6, 0), py(2.6, 0)); // head
    ctx.quadraticCurveTo(px(0.6, span * 0.6), py(0.6, span * 0.6), px(-1.8, span), py(-1.8, span));
    ctx.quadraticCurveTo(px(-0.2, span * 0.35), py(-0.2, span * 0.35), px(-1.4, 0), py(-1.4, 0)); // tail
    ctx.quadraticCurveTo(px(-0.2, -span * 0.35), py(-0.2, -span * 0.35), px(-1.8, -span), py(-1.8, -span));
    ctx.quadraticCurveTo(px(0.6, -span * 0.6), py(0.6, -span * 0.6), px(2.6, 0), py(2.6, 0));
    ctx.fill();
  }

  private drawFalcon(view: MurmurationView): void {
    const falcon = view.falcon;
    if (!falcon) {
      this.lastFalcon = null;
      return;
    }
    const ctx = this.ctx;

    // The falcon faces where the cursor is heading, eased so it banks, not snaps.
    if (this.lastFalcon) {
      const dx = falcon.x - this.lastFalcon.x;
      const dy = falcon.y - this.lastFalcon.y;
      if (dx * dx + dy * dy > 1) {
        const target = Math.atan2(dy, dx);
        let delta = target - this.falconHeading;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        this.falconHeading += delta * 0.2;
      }
    }
    this.lastFalcon = { x: falcon.x, y: falcon.y };

    ctx.strokeStyle = FALCON_RING;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.arc(falcon.x, falcon.y, falcon.alertRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Falcon: long pointed wings, slim tail.
    const c = Math.cos(this.falconHeading);
    const s = Math.sin(this.falconHeading);
    const p = (f: number, l: number) => [falcon.x + c * f + s * l, falcon.y + s * f - c * l] as const;
    ctx.fillStyle = FALCON_INK;
    ctx.beginPath();
    ctx.moveTo(...p(9, 0));
    ctx.quadraticCurveTo(...p(4, 6), ...p(-4, 15));
    ctx.lineTo(...p(-1, 3));
    ctx.lineTo(...p(-10, 2));
    ctx.lineTo(...p(-10, -2));
    ctx.lineTo(...p(-1, -3));
    ctx.lineTo(...p(-4, -15));
    ctx.quadraticCurveTo(...p(4, -6), ...p(9, 0));
    ctx.fill();
  }

  private skyFor(width: number, height: number): HTMLCanvasElement {
    const dpr = this.ctx.getTransform().a || 1;
    const key = `${width}x${height}@${dpr}`;
    if (this.sky && this.skyKey === key) return this.sky;

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    const g = canvas.getContext("2d")!;
    g.scale(dpr, dpr);

    const gradient = g.createLinearGradient(0, 0, 0, height);
    for (const [stop, colour] of SKY_STOPS) gradient.addColorStop(stop, colour);
    g.fillStyle = gradient;
    g.fillRect(0, 0, width, height);

    // A low sun, mostly hidden by the reeds.
    const sx = width * SUN.x;
    const sy = height * SUN.y;
    const r = Math.max(width, height);
    const glow = g.createRadialGradient(sx, sy, 0, sx, sy, r * 0.55);
    glow.addColorStop(0, SUN.core);
    glow.addColorStop(0.06, SUN.glow);
    glow.addColorStop(1, "rgba(255, 190, 120, 0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, width, height);

    // The first stars of the evening, high up.
    for (let i = 0; i < 70; i++) {
      const x = hash(i * 3 + 1) * width;
      const y = Math.pow(hash(i * 3 + 2), 2) * height * 0.4;
      g.fillStyle = `rgba(255, 244, 230, ${0.15 + hash(i * 3 + 3) * 0.45 * (1 - y / (height * 0.4))})`;
      g.fillRect(x, y, 1, 1);
    }

    this.sky = canvas;
    this.skyKey = key;
    return canvas;
  }
}
