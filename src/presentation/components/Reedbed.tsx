import { memo } from "react";

const W = 1600;
const H = 180;

/** Deterministic pseudo-random so the reeds never jump between renders. */
const rand = (i: number) => {
  const s = Math.sin(i * 91.7 + 12.3) * 10000;
  return s - Math.floor(s);
};

interface SeedHead {
  x: number;
  y: number;
  length: number;
  angle: number;
}

function reeds(count: number, seed: number, minH: number, maxH: number) {
  let blades = "";
  const heads: SeedHead[] = [];
  for (let i = 0; i < count; i++) {
    const x = (i / count) * W + rand(seed + i) * (W / count);
    const h = minH + rand(seed + i * 7) * (maxH - minH);
    const lean = (rand(seed + i * 13) - 0.5) * 50;
    const w = 1.6 + rand(seed + i * 17) * 2.2;
    const tipX = x + lean;
    const tipY = H - h;
    // A tapering blade: up one side, back down the other.
    blades += `M${x - w},${H} Q${x + lean * 0.3 - w * 0.4},${H - h * 0.55} ${tipX},${tipY} `;
    blades += `Q${x + lean * 0.3 + w * 0.4},${H - h * 0.55} ${x + w},${H} Z `;
    // Some reeds carry a feathery seed head, angled along the stem.
    if (rand(seed + i * 23) > 0.6) {
      const length = 10 + rand(seed + i * 29) * 12;
      const angle = (Math.atan2(-h, lean) * 180) / Math.PI;
      heads.push({ x: tipX, y: tipY, length, angle });
    }
  }
  return { blades, heads };
}

const FAR = reeds(140, 1, 40, 95);
const NEAR = reeds(90, 500, 70, 170);

function Layer({ reeds: r, className }: { reeds: ReturnType<typeof reeds>; className: string }) {
  return (
    <g className={className}>
      <path d={r.blades} />
      {r.heads.map((h, i) => (
        <ellipse key={i} cx={h.length / 2} cy={0} rx={h.length / 2} ry={3.2} transform={`translate(${h.x} ${h.y}) rotate(${h.angle})`} />
      ))}
    </g>
  );
}

/**
 * The reedbed the starlings are about to roost in. The flock flies behind it,
 * which gives the scene depth, and the legend sits on its dark band.
 */
export const Reedbed = memo(function Reedbed() {
  return (
    <svg className="reedbed" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path className="far-bank" d={`M0,${H} L0,${H - 38} Q400,${H - 60} 800,${H - 44} T${W},${H - 50} L${W},${H} Z`} />
      <Layer reeds={FAR} className="far-reeds" />
      <Layer reeds={NEAR} className="near-reeds" />
    </svg>
  );
});
