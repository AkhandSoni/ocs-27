"use client";
import { Check, ChevronRight, UserRound } from "lucide-react";
import { domainOrder, domainById } from "./content";
import type { ConsoleLibrary, Student } from "./useLibrary";
import type { DomainId } from "@/lib/recruitment";
import Glyph from "./Glyph";
export default function StudentExperience({
  student,
  library,
  onOpen,
  onAuthenticate,
}: {
  student: Student | null;
  library: ConsoleLibrary;
  onOpen: (id: DomainId) => void;
  onAuthenticate: () => void;
}) {
  return (
    <section className="native-app student-app">
      <div className="app-heading">
        <UserRound size={46} />
        <div>
          <p>PLAYER PROFILE / {student ? "LOCAL ACCOUNT" : "GUEST"}</p>
          <h1>{student?.name ?? "Guest player"}</h1>
        </div>
      </div>
      <p className="system-note">
        {student?.email ??
          "Explore freely. Sign in when you’re ready to submit an application."}
      </p>
      {!student && (
        <button className="quiet-button" onClick={onAuthenticate}>
          Sign in or create an account <ChevronRight size={17} />
        </button>
      )}
      <div
        className="application-slots"
        role="group"
        aria-label="My applications"
      >
        {domainOrder.map((id) => {
          const app = library.data.applications[id];
          return (
            <button key={id} onClick={() => onOpen(id)}>
              <Glyph id={id} />
              <span>
                <strong>{domainById[id].name}</strong>
                <small>
                  {app?.submittedAt
                    ? "Round 0 · local submission saved"
                    : app
                      ? "Round 0 · draft in progress"
                      : "No application started"}
                </small>
              </span>
              {app?.submittedAt ? (
                <Check size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          );
        })}
      </div>
      <p className="system-note">
        Application copies stay in this browser and are separated by account.
        Interview details are not published. No live recruitment decisions are
        shown.
      </p>
    </section>
  );
}
