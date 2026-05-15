import { useRef, useState } from "react";
import { Simulation, DEFAULT_CONFIG } from "./sim/simulation";
import type { SimConfig, SimStats } from "./sim/types";
import { MurmurationCanvas } from "./components/MurmurationCanvas";
import { Controls } from "./components/Controls";
import { Stats } from "./components/Stats";
import { Legend } from "./components/Legend";

/**
 * Top-level component.
 *
 * Architecture note: the Simulation owns the boid array and runs at 60 fps via
 * requestAnimationFrame. We deliberately keep that data OUT of React state —
 * a setState on every frame would push the render loop into the React fibre
 * scheduler, which would add 1-2ms of overhead per frame and possibly drop us
 * below 60 fps with 1000+ boids.
 *
 * React state holds only:
 *  - the slider values (so labels re-render)
 *  - low-frequency stats (sampled at ~2 Hz from the simulation)
 *
 * Slider changes mutate `sim.config` directly via the same object reference,
 * so the simulation loop sees changes on the next tick with no restart.
 */
export function App() {
  // useRef with a lazy-initialised value so we don't allocate a new Simulation
  // on every render (and especially not in StrictMode where components mount twice).
  const simRef = useRef<Simulation | null>(null);
  if (simRef.current === null) {
    simRef.current = new Simulation({ ...DEFAULT_CONFIG });
  }
  const sim = simRef.current;

  // Mirror of sim.config for UI. The simulation reads sim.config directly —
  // this state exists purely so slider labels and inputs re-render.
  const [config, setConfig] = useState<SimConfig>(sim.config);

  const [stats, setStats] = useState<SimStats>({ fps: 0, count: 0, order: 0 });

  /** Slider handler: mutate the live sim, then mirror into React state. */
  const updateConfig = <K extends keyof SimConfig>(key: K, value: SimConfig[K]): void => {
    sim.config[key] = value;
    setConfig({ ...sim.config });
  };

  return (
    <>
      <MurmurationCanvas sim={sim} onStats={setStats} />
      <Controls config={config} onChange={updateConfig} onReset={() => sim.spawn(sim.config.count)} onScatter={() => sim.scatter()} />
      <Stats stats={stats} />
      <Legend />
    </>
  );
}
