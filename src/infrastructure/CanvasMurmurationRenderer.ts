import type { MurmurationView } from "@application";

const SKY_RGB = "11, 13, 31";
const STARLING_COLOUR = "#e8e8ee";
const FALCON_RING_COLOUR = "rgba(255, 122, 89, 0.25)";

/**
 * Draws a MurmurationView onto a 2D canvas.
 *
 * Motion trails come from painting a translucent sky over the previous frame
 * instead of clearing it — `trail` is that alpha (higher = shorter trails).
 * Trails are a purely visual concern, so they live here, not in the domain.
 */
export class CanvasMurmurationRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  draw(view: MurmurationView, trail: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(${SKY_RGB}, ${trail})`;
    ctx.fillRect(0, 0, view.width, view.height);

    // Each starling is a tiny triangle pointing along its heading. The
    // rotation is inlined to avoid save/restore per bird.
    ctx.fillStyle = STARLING_COLOUR;
    for (const { x, y, heading } of view.starlings) {
      const cos = Math.cos(heading);
      const sin = Math.sin(heading);
      ctx.beginPath();
      ctx.moveTo(x + cos * 4, y + sin * 4);
      ctx.lineTo(x - cos * 3 + sin * 2, y - sin * 3 - cos * 2);
      ctx.lineTo(x - cos * 3 - sin * 2, y - sin * 3 + cos * 2);
      ctx.closePath();
      ctx.fill();
    }

    // Falcon alert ring — feedback that the cursor is being read.
    if (view.falcon) {
      ctx.strokeStyle = FALCON_RING_COLOUR;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(view.falcon.x, view.falcon.y, view.falcon.alertRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
