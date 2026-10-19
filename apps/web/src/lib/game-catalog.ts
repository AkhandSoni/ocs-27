import { DOMAINS } from "./domain-sequence.ts";

// The physical shelf carries ACM recruitment editions, sharing the TV artwork.
export const GAMES = DOMAINS.map(({ id, name, color }) => ({
  id, title: name.toUpperCase(), color,
}));
