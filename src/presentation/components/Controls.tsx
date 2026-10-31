import { type SettingKey, type Settings, SLIDERS } from "../settings";

interface Props {
  settings: Settings;
  onChange: (key: SettingKey, value: number) => void;
  onRegather: () => void;
  onScatter: () => void;
}

export function Controls({ settings, onChange, onRegather, onScatter }: Props) {
  return (
    <div className="panel controls">
      <h1>Murmuration</h1>
      <div className="sub">Boids with topological neighbours</div>

      {SLIDERS.map((s) => {
        const value = settings[s.key];
        return (
          <div key={s.key} className="slider">
            <label>
              <span>{s.label}</span>
              <span>{s.format ? s.format(value) : value.toString()}</span>
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
        <button onClick={onRegather}>Reset</button>
        <button onClick={onScatter}>Scatter</button>
      </div>
    </div>
  );
}
