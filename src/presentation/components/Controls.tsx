import { type CSSProperties, useState } from "react";
import { type SettingKey, type Settings, SLIDERS } from "../settings";

interface Props {
  settings: Settings;
  onChange: (key: SettingKey, value: number) => void;
  onRegather: () => void;
  onScatter: () => void;
}

/** On small screens the rules start folded away so the sky stays visible. */
const roomy = () => window.matchMedia("(min-width: 641px)").matches;

export function Controls({ settings, onChange, onRegather, onScatter }: Props) {
  const [open, setOpen] = useState(roomy);
  return (
    <section className="panel controls">
      <header>
        <h1>Murmuration</h1>
        <p className="sub">starlings at dusk, each watching its nearest few</p>
      </header>

      <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>Rules of the flock</summary>
        {SLIDERS.map((s) => {
          const value = settings[s.key];
          const fill = ((value - s.min) / (s.max - s.min)) * 100;
          return (
            <label key={s.key} className="slider">
              <span className="slider-head">
                <span>{s.label}</span>
                <output>{s.format ? s.format(value) : value.toString()}</output>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={value}
                style={{ "--fill": `${fill}%` } as CSSProperties}
                onChange={(e) => onChange(s.key, parseFloat(e.target.value))}
              />
            </label>
          );
        })}
      </details>

      <div className="row">
        <button onClick={onRegather}>Regather</button>
        <button onClick={onScatter}>Startle</button>
      </div>
    </section>
  );
}
