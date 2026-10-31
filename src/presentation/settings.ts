import type { Tuning } from "@application";

/** Purely visual preferences — not part of the flock's rules. */
export interface ViewSettings {
  /** Alpha of the per-frame sky wash; higher = shorter motion trails. */
  trail: number;
}

export const DEFAULT_VIEW: ViewSettings = { trail: 0.12 };

export type SettingKey = keyof Tuning | keyof ViewSettings;
export type Settings = Tuning & ViewSettings;

export interface SliderSpec {
  key: SettingKey;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
}

const fixed = (digits: number) => (v: number) => v.toFixed(digits);

export const SLIDERS: readonly SliderSpec[] = [
  { key: "population", label: "Count", min: 50, max: 1500, step: 10 },
  { key: "neighbours", label: "Neighbours (k)", min: 2, max: 14, step: 1 },
  { key: "separation", label: "Separation", min: 0, max: 3, step: 0.05, format: fixed(2) },
  { key: "alignment", label: "Alignment", min: 0, max: 3, step: 0.05, format: fixed(2) },
  { key: "cohesion", label: "Cohesion", min: 0, max: 3, step: 0.05, format: fixed(2) },
  { key: "evasion", label: "Predator force", min: 0, max: 20, step: 0.5, format: fixed(1) },
  { key: "topSpeed", label: "Max speed", min: 1, max: 8, step: 0.1, format: fixed(1) },
  { key: "trail", label: "Trail length", min: 0.02, max: 0.5, step: 0.01, format: fixed(2) },
];

export function isViewSetting(key: SettingKey): key is keyof ViewSettings {
  return key in DEFAULT_VIEW;
}
