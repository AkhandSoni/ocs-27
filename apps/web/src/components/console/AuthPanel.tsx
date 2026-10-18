"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import type { Student } from "./useLibrary";
export default function AuthPanel({
  onSuccess,
  onGuest,
}: {
  onSuccess: (student: Student) => void;
  onGuest?: () => void;
}) {
  const [mode, setMode] = useState<"signin" | "register">("signin"),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [profiles, setProfiles] = useState<{ name: string; email: string }[]>(
    [],
  );
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("ps5:profiles:v1") ?? "[]");
      if (Array.isArray(p))
        setProfiles(
          p
            .filter(
              (p) =>
                typeof p?.name === "string" && typeof p?.email === "string",
            )
            .slice(0, 5),
        );
    } catch {}
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/auth/${mode === "register" ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(
            mode === "register"
              ? { name, email, password, avatar: "astro" }
              : { email, password },
          ),
        },
      );
      const d = await response.json();
      if (!response.ok || !d.user)
        throw new Error(d.error ?? "Unable to sign in. Try again.");
      try {
        localStorage.setItem(
          "ps5:profiles:v1",
          JSON.stringify(
            [
              { name: d.user.name, email: d.user.email, avatar: d.user.avatar },
              ...profiles.filter((p) => p.email !== d.user.email),
            ].slice(0, 5),
          ),
        );
      } catch {}
      onSuccess(d.user);
      setPassword("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-native">
      <p className="system-kicker">LOCAL PLAYER ACCOUNT</p>
      <h2>{mode === "register" ? "Create your profile." : "Welcome back."}</h2>
      <p>
        Browse as a guest. A local account is required to save a prototype
        submission.
      </p>
      {mode === "signin" && profiles.length > 0 && (
        <div className="profile-picker" aria-label="Saved profiles">
          {profiles.map((p) => (
            <button
              key={p.email}
              onClick={() => setEmail(p.email)}
              aria-label={`Choose ${p.name} profile`}
            >
              <span>{p.name[0]}</span>
              {p.name}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={submit}>
        {mode === "register" && (
          <label className="console-field">
            <span>Display name</span>
            <input
              required
              minLength={2}
              maxLength={24}
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </label>
        )}
        <label className="console-field">
          <span>Email address</span>
          <input
            required
            type="email"
            autoComplete="username"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="console-field password-field">
          <span>Password</span>
          <input
            required
            type={show ? "text" : "password"}
            minLength={mode === "register" ? 8 : 1}
            maxLength={128}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>
        <p className="form-error" role="alert">
          {error}
        </p>
        <button className="launch-button" disabled={busy}>
          {busy ? (
            <LoaderCircle className="spinning" size={20} />
          ) : (
            <>
              {mode === "register" ? "Create account" : "Sign in"}
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>
      <button
        className="quiet-button"
        disabled={busy}
        onClick={() => {
          setMode(mode === "signin" ? "register" : "signin");
          setError("");
          setPassword("");
        }}
      >
        {mode === "signin"
          ? "New player? Create an account"
          : "Already have an account? Sign in"}
      </button>
      {onGuest && (
        <button className="startup-guest-button" onClick={onGuest}>
          Continue as guest
        </button>
      )}
      <small>
        Local console account. No email verification or external account
        provider.
      </small>
    </div>
  );
}
