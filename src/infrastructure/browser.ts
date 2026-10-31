import type { MurmurationService } from "@application";

type Stop = () => void;

/**
 * requestAnimationFrame loop. Calls `onFrame` every frame and `onFps` with
 * the measured frame rate every `sampleMs`.
 */
export function startAnimationLoop(onFrame: () => void, onFps: (fps: number) => void, sampleMs = 500): Stop {
  let raf = 0;
  let frames = 0;
  let since = performance.now();
  const tick = (now: number) => {
    onFrame();
    frames++;
    if (now - since > sampleMs) {
      onFps((frames * 1000) / (now - since));
      frames = 0;
      since = now;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** Keep a canvas filling the window at device resolution; the sky follows. */
export function fitCanvasToWindow(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, service: MurmurationService): Stop {
  const fit = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    service.resizeSky({ width, height });
  };
  fit();
  window.addEventListener("resize", fit);
  return () => window.removeEventListener("resize", fit);
}

/** The cursor plays the falcon. */
export function bindPointerAsFalcon(service: MurmurationService): Stop {
  const onMove = (e: MouseEvent) => service.sightFalcon({ x: e.clientX, y: e.clientY });
  const onLeave = () => service.loseFalcon();
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseout", onLeave);
  window.addEventListener("mouseleave", onLeave);
  return () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseout", onLeave);
    window.removeEventListener("mouseleave", onLeave);
  };
}
