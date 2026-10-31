import { useCallback, useEffect, useRef, useState } from "react";
import type { FlockMetrics, MurmurationService, Tuning } from "@application";
import { Controls } from "./components/Controls";
import { Legend } from "./components/Legend";
import { MurmurationCanvas } from "./components/MurmurationCanvas";
import { Reedbed } from "./components/Reedbed";
import { Stats } from "./components/Stats";
import { DEFAULT_VIEW, isViewSetting, type SettingKey, type ViewSettings } from "./settings";

export interface FrameStats extends FlockMetrics {
  fps: number;
}

/**
 * The flock lives in the application service, not in React state: setState
 * every frame would route 60 fps through the fibre scheduler. React only
 * holds what the panels display — the tuning (re-read from the service after
 * every change, so domain invariants are reflected) and stats sampled at 2 Hz.
 */
/** True once the pointer and keyboard have been still for `ms` — the UI then recedes. */
function useStillness(ms: number): boolean {
  const [still, setStill] = useState(false);
  useEffect(() => {
    let timer = window.setTimeout(() => setStill(true), ms);
    const wake = () => {
      setStill(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setStill(true), ms);
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [ms]);
  return still;
}

export function App({ service }: { service: MurmurationService }) {
  const [tuning, setTuning] = useState<Tuning>(() => service.tuning());
  const [view, setView] = useState<ViewSettings>(DEFAULT_VIEW);
  const [stats, setStats] = useState<FrameStats>({ fps: 0, population: 0, polarisation: 0 });

  // The render loop reads view settings through a ref so it never restarts.
  const viewRef = useRef(view);
  const still = useStillness(3500);
  viewRef.current = view;

  const change = useCallback(
    (key: SettingKey, value: number) => {
      if (isViewSetting(key)) {
        setView((v) => ({ ...v, [key]: value }));
      } else {
        service.tune({ [key]: value });
        setTuning(service.tuning());
      }
    },
    [service],
  );

  return (
    <div className={still ? "scene still" : "scene"}>
      <MurmurationCanvas service={service} viewRef={viewRef} onStats={setStats} />
      <Reedbed />
      <Controls
        settings={{ ...tuning, ...view }}
        onChange={change}
        onRegather={() => service.regather()}
        onScatter={() => service.scatter()}
      />
      <Stats stats={stats} />
      <Legend />
    </div>
  );
}
