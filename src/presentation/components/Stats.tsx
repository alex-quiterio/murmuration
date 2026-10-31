import type { FrameStats } from "../App";

/** How the flock feels, read from its polarisation λ. */
function mood(polarisation: number): string {
  if (polarisation < 0.3) return "scattered";
  if (polarisation < 0.6) return "gathering";
  if (polarisation < 0.85) return "swirling";
  if (polarisation < 0.95) return "murmuring";
  return "one mind";
}

export function Stats({ stats }: { stats: FrameStats }) {
  return (
    <aside className="panel stats" aria-label="Flock state">
      <div className="lambda">
        <span className="lambda-symbol">λ</span>
        <span className="lambda-value">{stats.polarisation.toFixed(2)}</span>
      </div>
      <div className="mood">{mood(stats.polarisation)}</div>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${Math.round(stats.polarisation * 100)}%` }} />
      </div>
      <dl>
        <div>
          <dt>starlings</dt>
          <dd>{stats.population}</dd>
        </div>
        <div>
          <dt>fps</dt>
          <dd>{stats.fps.toFixed(0)}</dd>
        </div>
      </dl>
    </aside>
  );
}
