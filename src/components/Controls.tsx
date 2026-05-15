import type { SimConfig } from "../sim/types";

interface Props {
  config: SimConfig;
  onChange: <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => void;
  onReset: () => void;
  onScatter: () => void;
}

interface SliderDef {
  key: keyof SimConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
}

const SLIDERS: SliderDef[] = [
  { key: "count", label: "Count", min: 50, max: 1500, step: 10 },
  { key: "k", label: "Neighbours (k)", min: 2, max: 14, step: 1 },
  { key: "sepWeight", label: "Separation", min: 0, max: 3, step: 0.05, format: (v) => v.toFixed(2) },
  { key: "aliWeight", label: "Alignment", min: 0, max: 3, step: 0.05, format: (v) => v.toFixed(2) },
  { key: "cohWeight", label: "Cohesion", min: 0, max: 3, step: 0.05, format: (v) => v.toFixed(2) },
  { key: "predWeight", label: "Predator force", min: 0, max: 20, step: 0.5, format: (v) => v.toFixed(1) },
  { key: "maxSpeed", label: "Max speed", min: 1, max: 8, step: 0.1, format: (v) => v.toFixed(1) },
  { key: "trail", label: "Trail length", min: 0.02, max: 0.5, step: 0.01, format: (v) => v.toFixed(2) },
];

export function Controls({ config, onChange, onReset, onScatter }: Props) {
  return (
    <div className="panel controls">
      <h1>Murmuration</h1>
      <div className="sub">Boids with topological neighbours</div>

      {SLIDERS.map((s) => {
        const value = config[s.key];
        const display = s.format ? s.format(value) : value.toString();
        return (
          <div key={s.key} className="slider">
            <label>
              <span>{s.label}</span>
              <span>{display}</span>
            </label>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={value}
              onChange={(e) => onChange(s.key, parseFloat(e.target.value))}
            />
          </div>
        );
      })}

      <div className="row">
        <button onClick={onReset}>Reset</button>
        <button onClick={onScatter}>Scatter</button>
      </div>
    </div>
  );
}
