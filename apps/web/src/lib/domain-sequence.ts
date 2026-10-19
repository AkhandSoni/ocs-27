export const DOMAINS = [
  { id: "tech", name: "Tech", lines: ["Tech"], color: "#d2ae6d", title: "Build what comes next.", description: "Ideas become systems. Explore development, engineering, and the things we can create together." },
  { id: "research", name: "Research", lines: ["Research"], color: "#d5af7d", title: "Begin with a question.", description: "Look closer, test an idea, and find a new perspective. Curiosity is the starting point." },
  { id: "competitive-coding", name: "Competitive Coding", lines: ["Competitive", "Coding"], color: "#bca3d9", title: "Find a better solution.", description: "Patterns, precision, and a different way to think. Explore the craft of problem solving." },
  { id: "design", name: "Design", lines: ["Design"], color: "#e9b292", title: "Make ideas feel real.", description: "Shape how things look, move, and work. Bring a thoughtful point of view to every detail." },
  { id: "management", name: "Management", lines: ["Management"], color: "#d9b281", title: "Bring it all together.", description: "Connect people and ideas. Turn a shared vision into an experience worth being part of." },
] as const;

// The five live cases replace these instances in the existing shelf.
export const DOMAIN_SHELF_INDICES = [4, 11, 18, 25, 32] as const;
export const CUES = {
  presentation: 1.8,
  focusEnd: .85,
  openStart: .65, openEnd: 1.65,
  liftStart: 1.85, liftEnd: 2.75,
  caseCloseStart: 2.9, caseCloseEnd: 3.6,
  flyStart: 3.8, flyEnd: 6,
  slotStart: 4.8, slotEnd: 5.65,
  insertStart: 6.2, insertEnd: 7.45,
  closeStart: 7.6, closeEnd: 8.15,
  caseReturnStart: 8.2, caseReturnEnd: 9.8,
  bootStart: 8.25, zoomEnd: 10.7, end: 11.7,
} as const;

export type DomainPhase = "idle" | "presenting" | "choosing" | "opening" | "lifting" | "travelling" | "inserting" | "closing" | "booting" | "active" | "returning";
export type DomainState = { phase: DomainPhase; selected: number | null };
export const IDLE_DOMAIN_STATE: DomainState = { phase: "idle", selected: null };

export function smooth(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export function segment(time: number, start: number, end: number) {
  return smooth((time - start) / (end - start));
}

/** Every prop and the camera are sampled from the same reversible playhead. */
export function sampleLoad(time: number) {
  const insert = segment(time, CUES.insertStart, CUES.insertEnd);
  return {
    focus: segment(time, 0, CUES.focusEnd),
    lid: segment(time, CUES.openStart, CUES.openEnd) * (1 - segment(time, CUES.caseCloseStart, CUES.caseCloseEnd)),
    caseReturn: segment(time, CUES.caseReturnStart, CUES.caseReturnEnd),
    lift: segment(time, CUES.liftStart, CUES.liftEnd),
    fly: segment(time, CUES.flyStart, CUES.flyEnd),
    slot: segment(time, CUES.slotStart, CUES.slotEnd) * (1 - segment(time, CUES.closeStart, CUES.closeEnd)),
    insert,
    discVisible: insert < 1,
    zoom: segment(time, CUES.bootStart, CUES.zoomEnd),
    boot: segment(time, CUES.bootStart, CUES.end),
  };
}

/** No timers: a background tab cannot finish an unseen insertion or boot. */
export class DomainSequence {
  presentation = 0;
  load = 0;
  private selected: number | null = null;
  private mode: "idle" | "presenting" | "choosing" | "loading" | "returning" = "idle";
  private brakeTime = 0;
  private exitVelocity = 0;

  get state(): DomainState {
    let phase: DomainPhase = this.mode === "loading" ? "opening" : this.mode;
    if (this.mode === "loading") {
      if (this.load >= CUES.end) phase = "active";
      else if (this.load >= CUES.bootStart) phase = "booting";
      else if (this.load >= CUES.insertEnd) phase = "closing";
      else if (this.load >= CUES.insertStart) phase = "inserting";
      else if (this.load >= CUES.flyStart) phase = "travelling";
      else if (this.load >= CUES.liftStart) phase = "lifting";
    }
    return { phase, selected: this.selected };
  }

  open() {
    if (this.mode !== "idle") return false;
    this.mode = "presenting";
    return true;
  }
  select(index: number) {
    if (this.mode !== "choosing" || !Number.isInteger(index) || !DOMAINS[index]) return false;
    this.selected = index;
    this.mode = "loading";
    return true;
  }
  exit() {
    if (this.mode === "idle" || this.mode === "returning") return false;
    this.exitVelocity = this.mode === "presenting" || (this.mode === "loading" && this.load < CUES.end) ? 1 : 0;
    this.brakeTime = 0;
    this.mode = "returning";
    return true;
  }
  update(delta: number, { visible = true, reduced = false }: { visible?: boolean; reduced?: boolean } = {}) {
    if (!visible || !Number.isFinite(delta) || delta < 0) return;
    const dt = Math.min(delta, .05);
    if (this.mode === "presenting") {
      this.presentation = reduced ? 1 : Math.min(1, this.presentation + dt / CUES.presentation);
      if (this.presentation === 1) this.mode = "choosing";
    } else if (this.mode === "loading") {
      // Reduced motion skips spatial travel, retaining a short, readable TV boot.
      this.load = Math.min(CUES.end, reduced ? Math.max(CUES.bootStart, this.load) + dt * 4 : this.load + dt);
    } else if (this.mode === "returning") {
      if (reduced) { this.load = 0; this.presentation = 0; }
      else {
        // Brake before reversing. A sudden negative playback rate would jerk
        // a disc that was already moving, even with a continuous position.
        const before = smooth(this.brakeTime / .38);
        this.brakeTime += dt;
        const after = smooth(this.brakeTime / .38);
        const rate = this.exitVelocity + (-1.45 - this.exitVelocity) * (before + after) / 2;
        if (this.selected !== null && (this.load > 0 || rate > 0)) this.load = Math.max(0, Math.min(CUES.end, this.load + dt * rate));
        else this.presentation = Math.max(0, Math.min(1, this.presentation + dt * rate / CUES.presentation));
      }
      if (this.load === 0 && this.presentation === 0) { this.mode = "idle"; this.selected = null; }
    }
  }
}
