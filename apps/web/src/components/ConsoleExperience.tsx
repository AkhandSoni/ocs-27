"use client";

// @refresh reset
// Restart the console flow when its hooks change during development.

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeft, Bot, Check, ChevronRight, CircleAlert, Eye, EyeOff, Gamepad2, LoaderCircle, Mountain, Orbit, Plus, Power, RotateCcw, Sparkles, Sun, X } from "lucide-react";
import styles from "./ConsoleExperience.module.css";

export type ConsoleUser = { id: string; name: string; email: string; avatar: string };
type ProfileHint = Pick<ConsoleUser, "name" | "email" | "avatar">;
type Stage = "checking" | "boot" | "users" | "signin" | "register" | "home";
type ConsoleExperienceProps = { children: ReactNode; ready?: boolean; suspended?: boolean; onHome?: (home: boolean) => void; onUserChange?: (user: ConsoleUser | null) => void };

const BOOT_KEY = "ps5:boot-seen:v1";
const PROFILE_KEY = "ps5:profiles:v1";
const BOOT_DURATION = 17400;
const avatars = [
  { id: "astro", name: "Astro", Icon: Bot },
  { id: "horizon", name: "Horizon", Icon: Mountain },
  { id: "cosmic", name: "Cosmic", Icon: Orbit },
  { id: "sunset", name: "Sunset", Icon: Sun },
  { id: "forest", name: "Forest", Icon: Gamepad2 },
  { id: "violet", name: "Violet", Icon: Sparkles },
];

// Exact family mark from Sony's public PlayStation design-kit SVG sprite.
// https://www.playstation.com/etc.clientlibs/global_pdc/clientlibs/auto-clientlibs/pdc.designkit/resources/ps-icons-map.svg
function PSMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 50 50" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M44.648 33.227a7.48 7.48 0 0 1-2.697 1.696L28.017 40.06v-3.788l10.173-3.75c1.19-.428 1.372-1.033.406-1.35a7.045 7.045 0 0 0-3.903.202l-6.676 2.47v-3.932l.403-.137a17.991 17.991 0 0 1 4.548-1.032 20.63 20.63 0 0 1 9.04 1.08c3.075.977 3.42 2.414 2.64 3.404zm-15.623-6.45v-9.689c0-1.137-.169-2.183-1.232-2.48-.815-.263-.793.497-.793 1.633v24.26l-7-2.076V9.499a77.528 77.528 0 0 1 8.934 2.471c5.519 1.902 7.389 4.27 7.389 9.605 0 5.2-3.235 7.17-7.298 5.202zM8 35.877c-3.155-.894-3.681-2.752-2.243-3.824a15.372 15.372 0 0 1 3.591-1.733L19 26.984v3.802l-7.033 2.417c-1.189.428-1.37 1.033-.405 1.351a7.063 7.063 0 0 0 3.904-.202L19 33.177v3.402c-.204.037-.432.073-.643.108a22.34 22.34 0 0 1-10.358-.81z" /></svg>;
}

function PS5Logo({ className = "" }: { className?: string }) {
  return <div className={`${styles.ps5Logo} ${className}`} role="img" aria-label="PlayStation 5"><PSMark /><svg viewBox="0 0 238.7 51.02" fill="currentColor" aria-hidden="true"><path d="M103.6 51a13.71 13.71 0 0 0 13.71-13.71V13.71a8.26 8.26 0 0 1 8.27-8.26h26.61a.37.37 0 0 0 .36-.37V.36a.36.36 0 0 0-.36-.36h-32.06a13.71 13.71 0 0 0-13.72 13.71v23.6a8.27 8.27 0 0 1-8.26 8.27H71.91a.36.36 0 0 0-.36.36v4.72a.36.36 0 0 0 .36.36zm59.93-31.84V.36a.36.36 0 0 1 .36-.36h72.45a.37.37 0 0 1 .37.36v4.72a.38.38 0 0 1-.37.37h-61.56a.36.36 0 0 0-.36.36v12.25a3.92 3.92 0 0 0 3.93 3.94h45.83a14.52 14.52 0 0 1 0 29h-60.29a.36.36 0 0 1-.36-.36v-4.7a.36.36 0 0 1 .36-.36h54.83a9.08 9.08 0 1 0-.07-18.15h-46.86a8.26 8.26 0 0 1-8.26-8.27M56 22a8.27 8.27 0 0 0 0-16.55H.36A.37.37 0 0 1 0 5.08V.36A.36.36 0 0 1 .36 0h61a13.72 13.72 0 0 1 0 27.43h-42.2a8.26 8.26 0 0 0-8.26 8.27v15a.36.36 0 0 1-.36.36H.36a.36.36 0 0 1-.36-.4v-15A13.71 13.71 0 0 1 13.72 22z" /></svg></div>;
}

function Avatar({ id, className = "" }: { id: string; className?: string }) {
  const avatar = avatars.find((item) => item.id === id) ?? avatars[0];
  const Icon = avatar.Icon;
  return <span className={`${styles.avatar} ${styles[avatar.id]} ${className}`}><span className={styles.avatarGlow} /><Icon strokeWidth={1.25} aria-hidden="true" /><span className={styles.avatarGlimmer} /></span>;
}

/** Canvas-rendered light, bokeh, and flowing particle ribbons. No recorded media. */
function ParticleBackground({ boot, quiet, paused }: { boot: boolean; quiet: boolean; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    if (paused) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 1280, 720); return; }
    let frame = 0;
    let start = 0;
    let lastFrame = 0;
    let seed = 91;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const particles = Array.from({ length: 250 }, (_, index) => ({ x: random(), y: random(), depth: random(), phase: random() * Math.PI * 2, speed: .025 + random() * .055, radius: index % 23 === 0 ? 4 + random() * 9 : .5 + random() * 2.4 }));
    const sprites = ["#efdec0", "#d5b47d", "#e0ddd5"].map((color) => {
      const sprite = document.createElement("canvas");
      sprite.width = 64; sprite.height = 64;
      const context = sprite.getContext("2d")!;
      const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32);
      glow.addColorStop(0, `${color}d0`); glow.addColorStop(.15, `${color}90`); glow.addColorStop(.42, `${color}25`); glow.addColorStop(1, `${color}00`);
      context.fillStyle = glow; context.fillRect(0, 0, 64, 64);
      return sprite;
    });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (now - lastFrame < (reduceMotion ? 90 : 30)) return;
      lastFrame = now;
      if (!start) start = now;
      const seconds = (now - start) / 1000;
      const time = reduceMotion ? seconds * .15 : seconds;
      const reveal = boot ? Math.min(1, Math.max(0, (seconds - 14.4) / 2.8)) : 1;
      const blue = boot ? Math.min(1, Math.max(0, (seconds - 12.7) / 3)) : 1;
      const introFade = boot ? 1 - Math.min(1, Math.max(0, (seconds - 14.4) / 2)) : 0;
      const base = ctx.createLinearGradient(0, 0, 950, 720);
      base.addColorStop(0, `rgb(${blue * 25},${blue * 26},${blue * 28})`);
      base.addColorStop(.5, `rgb(${reveal * 26},${reveal * 26},${blue * 27})`);
      base.addColorStop(1, `rgb(${reveal * 14},${reveal * 16},${blue * 20})`);
      ctx.fillStyle = base; ctx.fillRect(0, 0, 1280, 720);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const ambient = ctx.createRadialGradient(810, 590, 10, 810, 590, 750);
      ambient.addColorStop(0, `rgba(153,129,88,${reveal * (quiet ? .07 : .13)})`);
      ambient.addColorStop(.65, "rgba(100,92,77,.015)"); ambient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ambient; ctx.fillRect(0, 0, 1280, 720);
      // A broad, feathered overhead light has no visible geometric edges.
      if (!boot || seconds > 14.5) {
        const strength = (boot ? Math.min(1, (seconds - 14.5) / 2) : 1) * (quiet ? .025 : .045);
        ctx.save();
        ctx.translate(85 + Math.sin(time * .035) * 18, -165);
        ctx.rotate(-.55); ctx.scale(.83, 2.2);
        const overhead = ctx.createRadialGradient(0, 0, 0, 0, 0, 590);
        overhead.addColorStop(0, `rgba(231,230,224,${strength * 1.6})`);
        overhead.addColorStop(.26, `rgba(222,222,218,${strength})`);
        overhead.addColorStop(.65, `rgba(209,211,210,${strength * .3})`);
        overhead.addColorStop(1, "rgba(209,211,210,0)");
        ctx.fillStyle = overhead; ctx.fillRect(-650, -650, 1300, 1300);
        ctx.restore();
      }
      if (boot && seconds > 11.7 && seconds < 17.4) {
        const passage = Math.min(1, (seconds - 11.7) / 5.7);
        const centerX = 1600 - passage * 1470;
        const centerY = 610 - Math.sin(passage * Math.PI) * 150;
        const portalRadius = 300 + passage * 680;
        const portal = ctx.createRadialGradient(centerX, centerY, portalRadius * .35, centerX, centerY, portalRadius);
        portal.addColorStop(0, "rgba(1,11,20,0)");
        portal.addColorStop(.68, `rgba(34,91,117,${Math.sin(passage * Math.PI) * .34})`);
        portal.addColorStop(.88, `rgba(105,164,192,${Math.sin(passage * Math.PI) * .64})`);
        portal.addColorStop(.94, `rgba(190,214,226,${Math.sin(passage * Math.PI) * .28})`);
        portal.addColorStop(1, "rgba(5,20,37,0)");
        ctx.fillStyle = portal; ctx.fillRect(0, 0, 1280, 720);
      }
      particles.forEach((particle, index) => {
        const progress = (particle.x + time * particle.speed * (quiet ? .16 : .42)) % 1;
        const x = progress * 1600 - 160;
        const stream = 620 - x * .18 + Math.sin(x * .003 + time * .13) * 60;
        const y = stream + (particle.y - .5) * (135 + particle.depth * 290) - time * 2 % 50;
        const glint = .43 + Math.sin(time * .45 + particle.phase) * .22;
        const opacity = Math.sin(progress * Math.PI) * reveal * glint * (quiet ? .3 : .85) * (1 - introFade * .7);
        const radius = particle.radius * (1 + particle.depth) * (quiet ? .82 : 1);
        ctx.globalAlpha = opacity;
        ctx.drawImage(sprites[index % 9 === 0 ? 2 : index % 3 === 0 ? 0 : 1], x - radius * 3, y - radius * 3, radius * 6, radius * 6);
        if (radius < 3 && index % 5 === 0) { ctx.fillStyle = "#f5e7c2"; ctx.fillRect(x, y, .8, .8); }
      });
      // The small white point between the two family-mark holds.
      if (boot && seconds > 4.2 && seconds < 7.6) {
        ctx.globalAlpha = 1;
        const flash = Math.max(0, Math.sin(Math.min(1, (seconds - 4.2) / 3.4) * Math.PI));
        const light = ctx.createRadialGradient(640, 360, 0, 640, 360, 11);
        light.addColorStop(0, `rgba(255,255,255,${flash})`); light.addColorStop(.08, `rgba(229,237,255,${flash * .55})`); light.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = light; ctx.fillRect(0, 0, 1280, 720);
      }
      ctx.restore();
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [boot, quiet, paused]);
  return <canvas ref={canvasRef} width={1280} height={720} className={styles.particleCanvas} aria-hidden="true" />;
}

function readProfileHints(): ProfileHint[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is ProfileHint => !!item && typeof item.name === "string" && typeof item.email === "string" && typeof item.avatar === "string").slice(0, 5).map(({ name, email, avatar }) => ({ name, email, avatar })) : [];
  } catch { return []; }
}

export default function ConsoleExperience({ children, ready = true, suspended = false, onHome, onUserChange }: ConsoleExperienceProps) {
  const [stage, setStage] = useState<Stage>("checking");
  const [user, setUser] = useState<ConsoleUser | null>(null);
  const [profiles, setProfiles] = useState<ProfileHint[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileHint | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("astro");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [systemError, setSystemError] = useState("");
  const [powerOpen, setPowerOpen] = useState(false);
  const [time, setTime] = useState("");
  const screenRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const callbacks = useRef({ onHome, onUserChange });
  callbacks.current = { onHome, onUserChange };

  const remember = useCallback((nextUser: ConsoleUser) => {
    const hint = { name: nextUser.name, email: nextUser.email, avatar: nextUser.avatar };
    setProfiles((current) => {
      const next = [hint, ...current.filter((profile) => profile.email !== nextUser.email)].slice(0, 5);
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch { /* Private browsing may disable storage. */ }
      return next;
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setProfiles(readProfileHints());
    const unauthenticated = () => {
      let seen = false;
      try { seen = localStorage.getItem(BOOT_KEY) === "1"; } catch { /* Boot still works without local storage. */ }
      setStage(seen ? "users" : "boot");
    };
    void fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin", signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("We couldn’t check your account. Please try signing in.");
      const data = await response.json() as { user: ConsoleUser | null };
      if (controller.signal.aborted) return;
      if (data.user) { setUser(data.user); remember(data.user); setStage("home"); }
      else unauthenticated();
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setSystemError(cause instanceof Error ? cause.message : "Unable to connect. Please try signing in.");
      unauthenticated();
    });
    return () => controller.abort();
  }, [remember]);

  useEffect(() => { callbacks.current.onHome?.(stage === "home"); }, [stage]);
  useEffect(() => { callbacks.current.onUserChange?.(user); }, [user]);
  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    update(); const timer = setInterval(update, 60000); return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (stage !== "boot" || !ready) return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(BOOT_KEY, "1"); } catch { /* Continue when storage is unavailable. */ }
      setStage("users");
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1400 : BOOT_DURATION);
    return () => clearTimeout(timer);
  }, [stage, ready]);

  useEffect(() => {
    if (!ready || suspended) return;
    if (stage === "users") (screenRef.current?.querySelector<HTMLButtonElement>("[data-profile-known]") ?? screenRef.current?.querySelector<HTMLButtonElement>("[data-profile-card]"))?.focus({ preventScroll: true });
    if (stage === "signin") (selectedProfile ? passwordRef.current : emailRef.current)?.focus({ preventScroll: true });
    if (stage === "register") nameRef.current?.focus({ preventScroll: true });
  }, [stage, selectedProfile, ready, suspended]);

  useEffect(() => {
    const openUsers = () => { setStage((current) => current === "home" ? "users" : current); setError(""); setSystemError(""); };
    const logout = async () => {
      if (pending) return;
      setPending(true);
      try {
        const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
        if (!response.ok) throw new Error("We couldn’t sign you out. Please try again.");
        setUser(null); setStage("users"); setPassword(""); setError(""); setSystemError("");
      } catch (cause) { setSystemError(cause instanceof Error ? cause.message : "Unable to sign out. Please try again."); }
      finally { setPending(false); }
    };
    window.addEventListener("ps5:open-users", openUsers);
    window.addEventListener("ps5:logout", logout);
    return () => { window.removeEventListener("ps5:open-users", openUsers); window.removeEventListener("ps5:logout", logout); };
  }, [pending]);

  function openSignIn(profile: ProfileHint | null) {
    setError(""); setSystemError(""); setPassword(""); setShowPassword(false);
    setSelectedProfile(profile); setEmail(profile?.email ?? ""); setName(profile?.name ?? ""); setAvatar(profile?.avatar ?? "astro");
    if (profile && user?.email === profile.email) { setStage("home"); return; }
    setStage("signin");
  }

  function switchForm(next: "signin" | "register") {
    setStage(next); setSelectedProfile(null); setError(""); setPassword(""); setShowPassword(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(""); setSystemError("");
    try {
      const response = await fetch(`/api/auth/${stage === "register" ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify(stage === "register" ? { name: name.trim(), email: email.trim(), password, avatar } : { email: email.trim(), password }),
      });
      const data = await response.json() as { user?: ConsoleUser; error?: string };
      if (!response.ok || !data.user) throw new Error(data.error || "We couldn’t sign you in. Please try again.");
      setUser(data.user); remember(data.user); setPassword(""); setStage("home");
      try { localStorage.setItem(BOOT_KEY, "1"); } catch { /* Session cookies remain the account authority. */ }
    } catch (cause) { setError(cause instanceof Error && cause.message !== "Failed to fetch" ? cause.message : "Unable to connect. Check your connection and try again."); }
    finally { setPending(false); }
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !pending) {
      if (stage === "signin" || stage === "register") { setStage("users"); setError(""); setPassword(""); }
      else if (stage === "users" && user) setStage("home");
    }
    if (stage === "users" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      const cards = Array.from(screenRef.current?.querySelectorAll<HTMLButtonElement>("[data-profile-card]") ?? []);
      const current = cards.findIndex((card) => card === document.activeElement);
      if (!cards.length) return;
      event.preventDefault();
      cards[(current + (event.key === "ArrowRight" ? 1 : -1) + cards.length) % cards.length].focus();
    }
  }

  if (stage === "home") return <div className={styles.home} data-console-stage="home">{ready && children}{systemError && <div className={styles.homeError} role="alert"><CircleAlert size={16} />{systemError}<button aria-label="Dismiss message" onClick={() => setSystemError("")}><X size={16} /></button></div>}</div>;

  const isForm = stage === "signin" || stage === "register";
  const registering = stage === "register";
  return <div ref={screenRef} className={`${styles.console} ${stage === "boot" && !ready ? styles.bootPaused : ""} ${isForm ? styles.formScreen : ""}`} data-console-stage={stage} role="region" aria-label="PlayStation 5 console" onKeyDown={handleKeys}>
    <ParticleBackground boot={stage === "boot"} quiet={isForm || stage === "checking"} paused={suspended || (stage === "boot" && !ready)} />
    <div className={styles.vignette} aria-hidden="true" />

    {stage === "checking" && <div className={styles.checking} role="status" aria-label="Starting console"><span /><span /><span /></div>}

    {stage === "boot" && <div className={styles.bootSequence} aria-label="PlayStation 5 startup animation" role="status"><PSMark className={styles.bootFamilyMark} /><span className={styles.screenReader}>Starting PlayStation 5…</span></div>}

    {stage === "users" && <main className={styles.userSelection}>
      <time className={styles.systemTime}>{time}</time>
      <header className={styles.userHeading}><h1>Welcome Back to PlayStation</h1><p>Who’s using this controller?</p></header>
      <div className={styles.profiles}>
        <button data-profile-card className={`${styles.profileCard} ${styles.addProfile}`} onClick={() => openSignIn(null)} aria-label="Add user"><Gamepad2 className={styles.chosenController} size={24} strokeWidth={1.35} /><span className={styles.addProfileCircle}><Plus strokeWidth={1} /></span><span className={styles.profileName}>Add User</span></button>
        {profiles.map((profile) => <button key={profile.email} data-profile-card data-profile-known className={styles.profileCard} onClick={() => openSignIn(profile)} aria-label={user?.email === profile.email ? `Continue as ${profile.name}` : `Sign in as ${profile.name}`}><Gamepad2 className={styles.chosenController} size={24} strokeWidth={1.35} /><span className={styles.profileImage}><Avatar id={profile.avatar} />{user?.email === profile.email && <span className={styles.onlineIndicator}><Check size={13} /></span>}</span><span className={styles.profileName}>{profile.name}</span></button>)}
      </div>
      {systemError && <p className={styles.selectionError} role="alert"><CircleAlert size={15} />{systemError}</p>}
      <button className={styles.powerButton} onClick={() => setPowerOpen(!powerOpen)} aria-label="Power options" aria-expanded={powerOpen}><Power size={23} strokeWidth={1.4} /></button>
      {powerOpen && <div className={styles.powerMenu} role="group" aria-label="Power options"><button onClick={() => { setPowerOpen(false); setStage("boot"); }}><RotateCcw size={18} />Restart PS5</button><button onClick={() => setPowerOpen(false)}><X size={18} />Cancel</button></div>}
    </main>}

    {isForm && <main className={styles.authMain}>
      <button className={styles.backButton} onClick={() => { if (!pending) { setStage("users"); setError(""); setPassword(""); } }} disabled={pending} aria-label="Back to user selection"><ArrowLeft size={20} strokeWidth={1.3} /> Back</button>
      <PS5Logo className={styles.authLogo} />
      <section className={`${styles.authContent} ${registering ? styles.registration : ""}`} aria-labelledby="auth-title">
        {selectedProfile && !registering && <Avatar id={selectedProfile.avatar} className={styles.signInAvatar} />}
        <h1 id="auth-title">{registering ? "Create an Account" : "Sign In"}</h1>
        <p className={styles.accountContext}>Console account</p>
        <form onSubmit={submit} className={styles.authForm}>
          {registering && <label className={styles.field}><span>Online ID</span><input ref={nameRef} name="name" autoComplete="nickname" value={name} onChange={(event) => setName(event.target.value)} placeholder="Online ID" maxLength={24} minLength={2} required disabled={pending} /></label>}
          <label className={styles.field}><span>Sign-In ID (Email Address)</span><input ref={emailRef} name="email" type="email" autoComplete={registering ? "email" : "username"} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Sign-In ID (Email Address)" maxLength={254} required disabled={pending} /></label>
          <label className={`${styles.field} ${styles.passwordField}`}><span>Password</span><input ref={passwordRef} name="password" type={showPassword ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" minLength={registering ? 8 : undefined} maxLength={128} required disabled={pending} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} disabled={pending}>{showPassword ? <EyeOff size={20} strokeWidth={1.3} /> : <Eye size={20} strokeWidth={1.3} />}</button></label>
          {registering && <fieldset className={styles.avatarPicker}><legend>Choose your avatar</legend><div>{avatars.map((option) => <button key={option.id} type="button" className={avatar === option.id ? styles.selectedAvatar : ""} aria-label={`${option.name} avatar`} aria-pressed={avatar === option.id} onClick={() => setAvatar(option.id)} disabled={pending}><Avatar id={option.id} /></button>)}</div></fieldset>}
          <div className={styles.formError} aria-live="polite">{error && <><CircleAlert size={16} /><span>{error}</span></>}</div>
          <button className={styles.submitButton} type="submit" disabled={pending}>{pending ? <><LoaderCircle className={styles.spinner} size={20} />{registering ? "Creating Account…" : "Signing In…"}</> : <>Next<ChevronRight size={18} strokeWidth={1.5} /></>}</button>
        </form>
        <div className={styles.switchForm}><button onClick={() => switchForm(registering ? "signin" : "register")} disabled={pending}>{registering ? "Sign In" : "Create an Account"}</button></div>
      </section>
    </main>}

    {(stage === "users" || isForm) && <footer className={`${styles.consoleFooter} ${stage === "users" ? styles.pickerFooter : ""}`}><div><span className={styles.controllerKey}>×</span><span>{stage === "users" ? "Select" : "Confirm"}</span>{(user || isForm) && <><button className={styles.footerBack} onClick={() => { if (pending) return; if (isForm) { setStage("users"); setError(""); setPassword(""); } else setStage("home"); }} disabled={pending}><span className={styles.controllerKey}>○</span>Back</button></>}</div>{isForm && <span className={styles.consoleDesignation}>PS5</span>}</footer>}
  </div>;
}
