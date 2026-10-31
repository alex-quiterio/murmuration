import { type MutableRefObject, useEffect, useRef } from "react";
import type { MurmurationService } from "@application";
import { bindPointerAsFalcon, CanvasMurmurationRenderer, fitCanvasToWindow, startAnimationLoop } from "@infrastructure";
import type { FrameStats } from "../App";
import type { ViewSettings } from "../settings";

interface Props {
  service: MurmurationService;
  viewRef: MutableRefObject<ViewSettings>;
  /** Called at ~2 Hz with sampled stats — never every frame. */
  onStats: (stats: FrameStats) => void;
}

/** Mounts the canvas and wires the browser adapters to the service. */
export function MurmurationCanvas({ service, viewRef, onStats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const renderer = new CanvasMurmurationRenderer(ctx);
    const stops = [
      fitCanvasToWindow(canvas, ctx, service),
      bindPointerAsFalcon(service),
      startAnimationLoop(
        () => {
          service.advance();
          renderer.draw(service.view(), viewRef.current.trail);
        },
        (fps) => onStatsRef.current({ fps, ...service.metrics() }),
      ),
    ];
    return () => stops.forEach((stop) => stop());
  }, [service, viewRef]);

  return <canvas ref={canvasRef} className="murmuration" />;
}
