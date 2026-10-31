import { FlockingRules, Murmuration, type NeighbourhoodIndexer, Seed, Sky, Vector2 } from "@domain";
import type { FlockMetrics, MurmurationView, Tuning } from "./dto";
import { toMetrics, toRules, toTuning, toView } from "./mapping";
import type { MurmurationRepository } from "./MurmurationRepository";

/**
 * Application service: the use cases of the murmuration.
 *
 * Each command loads the aggregate, asks it to change, and saves the result.
 * Each query maps the aggregate to a DTO. No business rules live here —
 * they all belong to the domain.
 */
export class MurmurationService {
  constructor(
    private readonly repository: MurmurationRepository,
    private readonly indexer: NeighbourhoodIndexer,
  ) {}

  // ---- commands ---------------------------------------------------------

  /** Begin a murmuration in a sky of the given size. `seed` makes it reproducible. */
  gather(command: { width: number; height: number; seed: number }): void {
    this.repository.save(
      Murmuration.gather(FlockingRules.starlingDefaults(), Sky.of(command.width, command.height), Seed.of(command.seed)),
    );
  }

  advance(): void {
    this.change((m) => m.advance(this.indexer));
  }

  regather(): void {
    this.change((m) => m.regather());
  }

  scatter(): void {
    this.change((m) => m.scatter());
  }

  /** Change some rules; the rest stay as they are. */
  tune(changes: Partial<Tuning>): void {
    this.change((m) => m.adopt(toRules({ ...toTuning(m.rules), ...changes })));
  }

  resizeSky(command: { width: number; height: number }): void {
    this.change((m) => m.spanSky(Sky.of(command.width, command.height)));
  }

  sightFalcon(command: { x: number; y: number }): void {
    this.change((m) => m.sightFalcon(Vector2.of(command.x, command.y)));
  }

  loseFalcon(): void {
    this.change((m) => m.loseFalcon());
  }

  // ---- queries ----------------------------------------------------------

  tuning(): Tuning {
    return toTuning(this.repository.load().rules);
  }

  view(): MurmurationView {
    return toView(this.repository.load());
  }

  metrics(): FlockMetrics {
    return toMetrics(this.repository.load());
  }

  private change(behaviour: (m: Murmuration) => Murmuration): void {
    this.repository.save(behaviour(this.repository.load()));
  }
}
