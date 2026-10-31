import { MurmurationNotGathered, type MurmurationRepository } from "@application";
import type { Murmuration } from "@domain";

export class InMemoryMurmurationRepository implements MurmurationRepository {
  private current: Murmuration | null = null;

  load(): Murmuration {
    if (this.current === null) throw new MurmurationNotGathered();
    return this.current;
  }

  save(murmuration: Murmuration): void {
    this.current = murmuration;
  }
}
