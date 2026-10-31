import type { FrameStats } from "../App";

export function Stats({ stats }: { stats: FrameStats }) {
  return (
    <div className="panel stats">
      <div className="stat">
        <span>FPS</span>
        <span className="v">{stats.fps.toFixed(0)}</span>
      </div>
      <div className="stat">
        <span>Boids</span>
        <span className="v">{stats.population}</span>
      </div>
      <div className="stat">
        <span>Cohesion λ</span>
        <span className="v">{stats.polarisation.toFixed(2)}</span>
      </div>
    </div>
  );
}
