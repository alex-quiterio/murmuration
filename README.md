# Murmuration

A real-time starling murmuration simulation in React + TypeScript, running on a 2D canvas.

![flock](https://img.shields.io/badge/boids-1500-blue) ![react](https://img.shields.io/badge/react-18-61dafb) ![typescript](https://img.shields.io/badge/typescript-5-3178c6)

## Why "topological" boids

Reynolds' original boids model (1987) is brilliant but wrong in one detail: it assumes each bird looks at neighbours within a fixed radius. Ballerini et al. measured actual starling flocks over Rome with stereoscopic photography and found something different — each bird tracks its **~7 nearest neighbours regardless of distance**. This _topological_ rule, not the metric one, is what keeps real murmurations cohesive when density fluctuates and when a falcon scatters them.

This simulation uses topological neighbours by default (configurable via the `k` slider) and a spatial hash grid for O(n) neighbour queries.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Architecture

The simulation logic lives in [`src/sim/`](./src/sim/) and is intentionally **not** in React state. Storing 600+ boids in `useState` and triggering a re-render every frame would push the loop through React's fibre scheduler and add 1-2ms per frame.

Instead:

- [`Simulation`](./src/sim/simulation.ts) owns the boid array and exposes `step()` / `render()`.
- [`SpatialHash`](./src/sim/spatialHash.ts) does k-NN queries via grid hashing.
- React holds slider values and low-frequency stats (sampled at 2 Hz).
- Slider changes mutate `sim.config` directly through a shared reference — the loop sees them on the next tick with no restart.

## The four forces

| Force        | Direction               | Reads          | Notes                                                  |
| ------------ | ----------------------- | -------------- | ------------------------------------------------------ |
| Separation   | away from close neighbours | nearest 7 (default) | Only kicks in within `separationRadius` (18 px)       |
| Alignment    | toward neighbours' avg heading | nearest 7  | Steering force = `avg_v̂ * maxSpeed - self.v`         |
| Cohesion     | toward neighbours' centroid | nearest 7  | Normalised so density doesn't affect strength         |
| Predator     | away from cursor        | mouse           | Inverse-distance, ramped to 0 at `predatorRadius`     |

The order parameter shown in the stats panel is the [Vicsek model](https://en.wikipedia.org/wiki/Vicsek_model) magnetisation: `|⟨v̂⟩|`. Real flocks sit just below 1.0 — slightly off the ferromagnetic ground state, which is what gives them their fluid, ever-shifting look.

## Things to try

- **Crank cohesion to 3** — flock collapses into a tight ball
- **Set separation to 0** — classic Vicsek "moving herd"
- **Drag the cursor slowly through the middle** — watch information propagate as a wave (this matches Cavagna et al.'s measurements of real flocks at ~12 m/s under falcon attack)
- **Drop neighbours to 2** — flock fragments into many small subflocks
- **Drop neighbours to 14** — flock becomes too coupled and oscillates

## References

- Reynolds, C. W. (1987). [Flocks, herds and schools: A distributed behavioral model](https://www.red3d.com/cwr/boids/). _SIGGRAPH '87_.
- Ballerini, M. et al. (2008). [Interaction ruling animal collective behavior depends on topological rather than metric distance](https://www.pnas.org/doi/10.1073/pnas.0711437105). _PNAS_ 105(4).
- Cavagna, A. et al. (2010). [Scale-free correlations in starling flocks](https://www.pnas.org/doi/10.1073/pnas.1005766107). _PNAS_ 107(26).
- Vicsek, T. et al. (1995). [Novel type of phase transition in a system of self-driven particles](https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.75.1226). _Phys. Rev. Lett._ 75.
