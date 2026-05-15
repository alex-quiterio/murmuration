import { useEffect, useRef } from "react";
import type { Simulation } from "../sim/simulation";
import type { SimStats } from "../sim/types";

interface Props {
  sim: Simulation;
  /** Called at ~2 Hz with sampled stats. NOT called every frame. */
  onStats: (s: SimStats) => void;
}

/**
 * Canvas component that drives the rAF loop.
 *
 * Why useEffect with an empty dep array (and an `sim` that's stable from the
 * parent's useRef): we want the loop to start once on mount and stop on
 * unmount. The simulation is mutated externally via sim.config / sim.mouse,
 * so we never need to restart the loop on prop changes.
 *
 * The onStats callback is held in a ref so we don't re-bind the loop when
 * the parent's setStats identity changes (which it does on every render).
 */
export function MurmurationCanvas({ sim, onStats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statsCbRef = useRef(onStats);
  statsCbRef.current = onStats;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ---- size handling --------------------------------------------------
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sim.resize(w, h);
    };
    fit();
    // First spawn — needs valid dimensions, so it has to happen after fit().
    if (sim.boids.length === 0) sim.spawn(sim.config.count);
    window.addEventListener("resize", fit);

    // ---- mouse → predator ----------------------------------------------
    const onMove = (e: MouseEvent) => {
      sim.mouse.x = e.clientX;
      sim.mouse.y = e.clientY;
      sim.mouse.active = true;
    };
    const onLeave = () => {
      sim.mouse.active = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("mouseleave", onLeave);

    // ---- main loop ------------------------------------------------------
    let raf = 0;
    let frames = 0;
    let fpsT = performance.now();

    const tick = (t: number) => {
      sim.step();
      sim.render(ctx);
      frames++;
      if (t - fpsT > 500) {
        const fps = (frames * 1000) / (t - fpsT);
        frames = 0;
        fpsT = t;
        statsCbRef.current(sim.sampleStats(fps));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [sim]);

  return <canvas ref={canvasRef} className="murmuration" />;
}
