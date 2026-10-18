"use client";
import { useEffect, useState } from "react";
import {
  emptyApplicant,
  type Applicant,
  type Application,
  type DomainId,
} from "@/lib/recruitment";
export type Student = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};
export type Library = {
  version: 2;
  applications: Partial<Record<DomainId, Application>>;
  snakeBest: number;
};
export const libraryKey = (id: string) => `ocs:console:v2:${id}`;
export function readLibrary(raw: string | null): Library {
  const empty: Library = { version: 2, applications: {}, snakeBest: 0 };
  try {
    const d = JSON.parse(raw ?? "null");
    if (!d?.applications) return empty;
    for (const id of [
      "tech",
      "research",
      "management",
      "design",
      "cc",
    ] as DomainId[]) {
      const a = d.applications[id];
      if (
        a?.domain === id &&
        a.applicant &&
        Object.keys(emptyApplicant()).every(
          (k) => typeof a.applicant[k] === "string",
        ) &&
        Array.isArray(a.answers) &&
        a.answers.length === 3 &&
        a.answers.every((x: unknown) => typeof x === "string") &&
        typeof a.updatedAt === "string" &&
        (!a.submittedAt || typeof a.submittedAt === "string")
      )
        empty.applications[id] = a;
    }
    empty.snakeBest =
      Number.isSafeInteger(d.snakeBest) && d.snakeBest >= 0 ? d.snakeBest : 0;
    return empty;
  } catch {
    return empty;
  }
}
export function mergeGuest(student: Student) {
  try {
    const own = readLibrary(localStorage.getItem(libraryKey(student.id)));
    const guest = readLibrary(localStorage.getItem(libraryKey("guest")));
    const drafts = Object.fromEntries(
      Object.entries(guest.applications)
        .filter(([, a]) => !a?.submittedAt)
        .map(([id, a]) => [
          id,
          {
            ...a,
            applicant: {
              ...a!.applicant,
              name: a!.applicant.name || student.name,
              email: a!.applicant.email || student.email,
            },
          },
        ]),
    );
    localStorage.setItem(
      libraryKey(student.id),
      JSON.stringify({
        ...own,
        snakeBest: Math.max(own.snakeBest, guest.snakeBest),
        applications: { ...drafts, ...own.applications },
      }),
    );
    localStorage.removeItem(libraryKey("guest"));
  } catch {
    /* The library reports unavailable storage. */
  }
}
export function useLibrary(student: Student | null) {
  const owner = student?.id ?? "guest";
  const [state, setState] = useState<{ owner: string; data: Library }>({
    owner: "",
    data: { version: 2, applications: {}, snakeBest: 0 },
  });
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(libraryKey(owner)) ??
        (owner !== "guest"
          ? localStorage.getItem(`acm:ocs:prototype:v1:${owner}`)
          : null);
      setState({ owner, data: readLibrary(raw) });
      setError("");
    } catch {
      setState({ owner, data: readLibrary(null) });
      setError("Storage is unavailable. Drafts will last only for this visit.");
    }
  }, [owner]);
  const ready = state.owner === owner;
  function update(fn: (data: Library) => Library) {
    if (!ready) return false;
    const next = fn(state.data);
    let saved = true;
    try {
      localStorage.setItem(libraryKey(owner), JSON.stringify(next));
      setError("");
    } catch {
      saved = false;
      setError("Storage is unavailable. Drafts will last only for this visit.");
    }
    setState({ owner, data: next });
    return saved;
  }
  function draft(id: DomainId, applicant?: Applicant, answers?: string[]) {
    return update((d) => {
      const old = d.applications[id];
      if (old?.submittedAt) return d;
      const base = old ?? {
        domain: id,
        applicant: emptyApplicant(student?.name, student?.email),
        answers: ["", "", ""],
        updatedAt: new Date().toISOString(),
      };
      return {
        ...d,
        applications: {
          ...d.applications,
          [id]: {
            ...base,
            applicant: applicant ?? base.applicant,
            answers: answers ?? base.answers,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }
  function submit(id: DomainId) {
    if (!student) return false;
    const old = state.data.applications[id];
    if (!old) return false;
    const now = new Date().toISOString();
    const next = {
      ...state.data,
      applications: {
        ...state.data.applications,
        [id]: { ...old, submittedAt: now, updatedAt: now },
      },
    };
    try {
      localStorage.setItem(libraryKey(owner), JSON.stringify(next));
      setState({ owner, data: next });
      setError("");
      return true;
    } catch {
      setError(
        "Could not save the submission. Enable browser storage and try again.",
      );
      return false;
    }
  }
  return {
    data: state.data,
    ready,
    error,
    draft,
    submit,
    update,
    reset: () => update(() => readLibrary(null)),
  };
}
export type ConsoleLibrary = ReturnType<typeof useLibrary>;
