import type { Murmuration } from "@domain";

/** Port: where the current Murmuration aggregate lives between commands. */
export interface MurmurationRepository {
  load(): Murmuration;
  save(murmuration: Murmuration): void;
}

export class MurmurationNotGathered extends Error {
  override readonly name = "MurmurationNotGathered";
  constructor() {
    super("No murmuration has been gathered yet — call MurmurationService.gather() first.");
  }
}
