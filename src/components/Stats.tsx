import type { SimStats } from "../sim/types";

interface Props {
  stats: SimStats;
}

export function Stats({ stats }: Props) {
  return (
    <div className="panel stats">
      <div className="stat">
        <span>FPS</span>
        <span className="v">{stats.fps.toFixed(0)}</span>
      </div>
      <div className="stat">
        <span>Boids</span>
        <span className="v">{stats.count}</span>
      </div>
      <div className="stat">
        <span>Cohesion λ</span>
        <span className="v">{stats.order.toFixed(2)}</span>
      </div>
    </div>
  );
}
