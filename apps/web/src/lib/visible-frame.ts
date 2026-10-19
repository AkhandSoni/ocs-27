/** Preserve visible elapsed time without feeding large jumps into the reversible
 * timeline. The caller resets its clock while hidden/offscreen. Half a second
 * bounds recovery after a visible stall; each simulation step remains <=50ms.
 */
export function advanceVisibleFrame(delta: number, advance: (step: number) => void) {
  if (!Number.isFinite(delta) || delta <= 0) return;
  let remaining = Math.min(delta, .5);
  while (remaining > 1e-8) {
    const step = Math.min(remaining, .05);
    advance(step);
    remaining -= step;
  }
}
