/** Thrown when a value object would be constructed in an impossible state. */
export class InvariantViolation extends Error {
  override readonly name = "InvariantViolation";
}

export function requireFinite(name: string, value: number): number {
  if (!Number.isFinite(value)) throw new InvariantViolation(`${name} must be a finite number, got ${value}`);
  return value;
}

export function requireNonNegative(name: string, value: number): number {
  if (requireFinite(name, value) < 0) throw new InvariantViolation(`${name} must be ≥ 0, got ${value}`);
  return value;
}

export function requirePositive(name: string, value: number): number {
  if (requireFinite(name, value) <= 0) throw new InvariantViolation(`${name} must be > 0, got ${value}`);
  return value;
}

export function requireWholeCount(name: string, value: number, min = 0): number {
  const whole = Math.round(requireFinite(name, value));
  if (whole < min) throw new InvariantViolation(`${name} must be ≥ ${min}, got ${value}`);
  return whole;
}
