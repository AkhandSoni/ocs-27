"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock, LoaderCircle } from "lucide-react";
import {
  emptyApplicant,
  type Applicant,
  type DomainId,
} from "@/lib/recruitment";
import { domainById } from "./content";
import type { ConsoleLibrary, Student } from "./useLibrary";
import { useExperienceInput } from "./ConsoleInput";
export default function ApplicationExperience({
  id,
  student,
  library,
  onAuthenticate,
  onBack,
}: {
  id: DomainId;
  student: Student | null;
  library: ConsoleLibrary;
  onAuthenticate: () => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const form = useRef<HTMLFormElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const d = domainById[id],
    app = library.data.applications[id];
  const applicant =
      app?.applicant ?? emptyApplicant(student?.name, student?.email),
    answers = app?.answers ?? ["", "", ""];
  useEffect(() => {
    if (library.ready && !app) library.draft(id);
  }, [library.ready, id, app, library]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    form.current?.querySelector(".form-body")?.scrollTo(0, 0);
  }, [step]);
  useExperienceInput((action) => {
    if (action === "back" && step > 0 && !app?.submittedAt) {
      setStep((x) => x - 1);
      return true;
    }
    return false;
  });
  function update(key: keyof Applicant, value: string) {
    library.draft(id, { ...applicant, [key]: value });
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !form.current?.reportValidity()) return;
    setError("");
    if (step < 5) {
      setStep(step + 1);
      return;
    }
    if (!student) {
      onAuthenticate();
      return;
    }
    setBusy(true);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    if (!library.submit(id))
      setError(
        "Your submission could not be saved. Enable browser storage, then try again.",
      );
    setBusy(false);
  }
  const input = (
    key: keyof Applicant,
    label: string,
    placeholder: string,
    optional = false,
  ) => (
    <label className="console-field">
      <span>
        {label}
        {optional && <small>Optional</small>}
      </span>
      <input
        type={key === "email" ? "email" : key === "portfolio" ? "url" : "text"}
        required={!optional}
        maxLength={key === "portfolio" ? 1000 : 254}
        value={applicant[key]}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
  if (!library.ready)
    return <section className="native-app">Loading local application…</section>;
  if (app?.submittedAt)
    return (
      <section
        className="native-app application-receipt"
        data-application-complete
      >
        <div className="receipt-check">
          <Check size={42} />
        </div>
        <p className="system-kicker">ROUND 00 / {d.name.toUpperCase()}</p>
        <h1>Application complete.</h1>
        <p className="receipt-status">
          Local copy saved · {new Date(app.submittedAt).toLocaleString("en-IN")}
        </p>
        <p className="system-note">
          This is a prototype submission saved in this browser. It has not been
          sent to a recruitment team. Live review and interview scheduling are
          not connected.
        </p>
        <div className="receipt-answers" tabIndex={0}>
          <h3>
            {app.applicant.name} / {app.applicant.registration}
          </h3>
          <p>
            {app.applicant.email} · {app.applicant.branch} · Year{" "}
            {app.applicant.year}
          </p>
          <h3>Why ACM-VIT?</h3>
          <p>{app.applicant.motivation}</p>
          {app.applicant.portfolio && <p>{app.applicant.portfolio}</p>}
          {d.questions.map((q, i) => (
            <div key={q}>
              <h3>{q}</h3>
              <p>{app.answers[i]}</p>
            </div>
          ))}
        </div>
        <button className="launch-button" onClick={onBack}>
          Back to domain <ArrowRight size={20} />
        </button>
      </section>
    );
  const question =
    step === 1 ? "What brings you to ACM-VIT?" : d.questions[step - 2];
  return (
    <section
      className="native-app application-app"
      data-application-domain={id}
    >
      <div className="application-heading">
        <span>
          ROUND 00 <b>/</b> {d.name.toUpperCase()}
        </span>
        <span>{String(step + 1).padStart(2, "0")} / 06</span>
      </div>
      <div
        className="step-track"
        aria-label={`Application step ${step + 1} of 6`}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} data-active={i <= step} />
        ))}
      </div>
      <form ref={form} onSubmit={submit} className="native-form">
        <div className="form-body">
          <p className="system-kicker">
            {step === 0
              ? "PLAYER INFORMATION"
              : step === 5
                ? "FINAL CHECK"
                : "YOUR PERSPECTIVE"}
          </p>
          <h1 tabIndex={-1} ref={heading}>
            {step === 0
              ? "First, your introduction."
              : step === 5
                ? "Ready when you are."
                : question}
          </h1>
          {step === 0 ? (
            <div className="identity-fields">
              {input("name", "Full name", "Your name")}
              {input("email", "Email address", "you@example.com")}
              {input(
                "registration",
                "VIT registration number",
                "e.g. 26BCE0001",
              )}
              {input("branch", "Branch / programme", "e.g. B.Tech CSE")}
              <label className="console-field">
                <span>Year of study</span>
                <select
                  aria-label="Year of study"
                  required
                  value={applicant.year}
                  onChange={(e) => update("year", e.target.value)}
                >
                  <option value="">Select year</option>
                  {["1", "2", "3", "4", "5", "PG"].map((y) => (
                    <option key={y} value={y}>
                      {y === "PG" ? "Postgraduate" : `Year ${y}`}
                    </option>
                  ))}
                </select>
              </label>
              {input("portfolio", "Portfolio / GitHub", "https://…", true)}
            </div>
          ) : step < 5 ? (
            <label className="console-field long-answer">
              <span>
                Your answer{" "}
                <small>
                  {
                    (step === 1 ? applicant.motivation : answers[step - 2])
                      .length
                  }{" "}
                  / {step === 1 ? 3000 : 5000}
                </small>
              </span>
              <textarea
                aria-label="Your answer"
                required
                rows={7}
                maxLength={step === 1 ? 3000 : 5000}
                value={step === 1 ? applicant.motivation : answers[step - 2]}
                onChange={(e) =>
                  step === 1
                    ? update("motivation", e.target.value)
                    : library.draft(
                        id,
                        undefined,
                        answers.map((a, i) =>
                          i === step - 2 ? e.target.value : a,
                        ),
                      )
                }
                placeholder="Take your time. We want to understand how you think."
              />
            </label>
          ) : (
            <div className="application-review">
              <div>
                <h3>{applicant.name}</h3>
                <p>
                  {applicant.email} · {applicant.registration}
                  <br />
                  {applicant.branch} · Year {applicant.year}
                </p>
                <button
                  type="button"
                  className="quiet-button"
                  onClick={() => setStep(0)}
                >
                  Edit introduction
                </button>
              </div>
              <h3>Why ACM-VIT?</h3>
              <p>{applicant.motivation}</p>
              {d.questions.map((q, i) => (
                <div key={q}>
                  <h3>{q}</h3>
                  <p>{answers[i]}</p>
                  <button
                    type="button"
                    className="quiet-button"
                    onClick={() => setStep(i + 2)}
                  >
                    Edit answer
                  </button>
                </div>
              ))}
              <label className="console-consent">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                I understand this is a prototype and my application is saved
                only in this browser.
              </label>
            </div>
          )}
        </div>
        <div className="form-feedback" role="status">
          {error ||
            library.error ||
            "Draft saved on this console · browser-local"}
        </div>
        <footer className="form-controls">
          <button
            type="button"
            className="quiet-button"
            onClick={() => (step ? setStep(step - 1) : onBack())}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button type="submit" className="launch-button" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="spinning" size={18} />
                Saving…
              </>
            ) : step === 5 ? (
              student ? (
                <>
                  Save submission <Check size={19} />
                </>
              ) : (
                <>
                  Sign in to submit <Lock size={18} />
                </>
              )
            ) : (
              <>
                Continue <ArrowRight size={20} />
              </>
            )}
          </button>
        </footer>
      </form>
    </section>
  );
}
