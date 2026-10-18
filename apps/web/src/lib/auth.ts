import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { closeSync, mkdirSync, openSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type AuthUser = { id: string; name: string; email: string; avatar: string };
type AuthSession = { user: AuthUser; token: string; expiresAt: number };
type UserRecord = AuthUser & { password_hash: string; password_salt: string };
type LoginAttempt = { attempts: number; resets_at: number };

export type AuthStore = {
  register: (input: unknown) => Promise<AuthSession>;
  login: (input: unknown) => Promise<AuthSession>;
  getSession: (token: string | null) => AuthUser | null;
  logout: (token: string | null) => void;
  close: () => void;
};

export const SESSION_COOKIE = "afterhours_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const MAX_BODY_BYTES = 4096;
const AVATARS = new Set(["astro", "horizon", "cosmic", "sunset", "forest", "violet"]);
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

export class AuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

function fields(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AuthError(400, "INVALID_INPUT", "Enter your account details.");
  }
  return input as Record<string, unknown>;
}

function emailAddress(value: unknown): string {
  if (typeof value !== "string") throw new AuthError(400, "INVALID_INPUT", "Enter a valid email address.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@\x00-\x1f\x7f]+@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f]+$/.test(email)) {
    throw new AuthError(400, "INVALID_INPUT", "Enter a valid email address.");
  }
  return email;
}

function passwordValue(value: unknown, registering: boolean): string {
  if (typeof value !== "string" || value.length > 128 || value.length < (registering ? 8 : 1)) {
    throw new AuthError(400, "INVALID_INPUT", registering
      ? "Use a password between 8 and 128 characters."
      : "Enter your email and password.");
  }
  // Passwords are intentionally not trimmed or normalized.
  return value;
}

function publicUser(row: AuthUser): AuthUser {
  return { id: row.id, name: row.name, email: row.email, avatar: row.avatar };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function derivePassword(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, SCRYPT_OPTIONS, (error, key) => error ? reject(error) : resolve(key));
  });
}

/** Server-only, local SQLite accounts. Each store owns its database connection. */
export function createAuthStore(databasePath = path.join(process.cwd(), ".data", "console.sqlite")): AuthStore {
  if (databasePath !== ":memory:") {
    mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
    // Restrict new database files to their owner on systems supporting POSIX modes.
    closeSync(openSync(/* turbopackIgnore: true */ databasePath, "a", 0o600));
  }
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      avatar TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS login_attempts (
      email_hash TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL,
      resets_at INTEGER NOT NULL
    );
  `);

  function createSession(user: AuthUser): AuthSession {
    const token = randomBytes(32).toString("hex");
    const now = Date.now();
    const expiresAt = now + SESSION_SECONDS * 1000;
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
      .run(hashToken(token), user.id, expiresAt);
    return { user: publicUser(user), token, expiresAt };
  }

  return {
    async register(input) {
      const body = fields(input);
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if ([...name].length < 2 || [...name].length > 24 || /[\x00-\x1f\x7f]/.test(name)) {
        throw new AuthError(400, "INVALID_INPUT", "Choose a display name between 2 and 24 characters.");
      }
      const email = emailAddress(body.email);
      const password = passwordValue(body.password, true);
      const avatar = body.avatar === undefined ? "astro" : body.avatar;
      if (typeof avatar !== "string" || !AVATARS.has(avatar)) {
        throw new AuthError(400, "INVALID_INPUT", "Choose one of the available avatars.");
      }
      const salt = randomBytes(16).toString("hex");
      const key = await derivePassword(password, salt);
      const user: AuthUser = { id: randomUUID(), name, email, avatar };
      // The unique database constraint resolves concurrent registrations atomically.
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare("INSERT INTO users (id, name, email, avatar, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(user.id, user.name, user.email, user.avatar, key.toString("hex"), salt, Date.now());
        const session = createSession(user);
        db.exec("COMMIT");
        return session;
      } catch (error) {
        db.exec("ROLLBACK");
        if (error instanceof Error && error.message.includes("UNIQUE constraint failed: users.email")) {
          throw new AuthError(409, "EMAIL_IN_USE", "An account with this email already exists. Sign in instead.");
        }
        throw error;
      }
    },

    async login(input) {
      const body = fields(input);
      const email = emailAddress(body.email);
      const password = passwordValue(body.password, false);
      const emailHash = hashToken(email);
      const now = Date.now();
      db.prepare("DELETE FROM login_attempts WHERE resets_at <= ?").run(now);
      const attempt = db.prepare("SELECT attempts, resets_at FROM login_attempts WHERE email_hash = ?")
        .get(emailHash) as LoginAttempt | undefined;
      if (attempt && attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
        throw new AuthError(429, "TOO_MANY_ATTEMPTS", "Too many sign-in attempts. Try again in 15 minutes.");
      }
      // Count before the asynchronous KDF so parallel requests cannot bypass the limit.
      db.prepare(`INSERT INTO login_attempts (email_hash, attempts, resets_at) VALUES (?, 1, ?)
        ON CONFLICT(email_hash) DO UPDATE SET attempts = attempts + 1`)
        .run(emailHash, now + LOGIN_WINDOW_MS);
      const row = db.prepare("SELECT id, name, email, avatar, password_hash, password_salt FROM users WHERE email = ?")
        .get(email) as UserRecord | undefined;
      // Unknown emails still run the same KDF to avoid a fast account-existence probe.
      const key = await derivePassword(password, row?.password_salt ?? "0".repeat(32));
      const expected = row ? Buffer.from(row.password_hash, "hex") : Buffer.alloc(64);
      if (!timingSafeEqual(key, expected) || !row) {
        throw new AuthError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
      }
      db.prepare("DELETE FROM login_attempts WHERE email_hash = ?").run(emailHash);
      return createSession(row);
    },

    getSession(token) {
      if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
      const now = Date.now();
      db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
      const row = db.prepare(`SELECT users.id, users.name, users.email, users.avatar
        FROM sessions JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ? AND sessions.expires_at > ?`)
        .get(hashToken(token), now) as AuthUser | undefined;
      return row ? publicUser(row) : null;
    },

    logout(token) {
      if (token && /^[a-f0-9]{64}$/.test(token)) {
        db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
      }
    },

    close() { db.close(); },
  };
}

const authGlobal = globalThis as typeof globalThis & { afterhoursAuthStore?: AuthStore };

export function getAuthStore(): AuthStore {
  authGlobal.afterhoursAuthStore ??= createAuthStore();
  return authGlobal.afterhoursAuthStore;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  const url = new URL(request.url);
  // Next may construct request.url with the server's 0.0.0.0 bind hostname.
  // Host is the browser's actual target; do not trust a forwarded-host override.
  const expectedOrigin = `${url.protocol}//${request.headers.get("host") ?? url.host}`;
  if (!origin || origin !== expectedOrigin || (site && site !== "same-origin" && site !== "none")) {
    throw new AuthError(403, "INVALID_ORIGIN", "This request must come from the lounge.");
  }
}

export async function readAuthBody(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new AuthError(415, "INVALID_CONTENT_TYPE", "Send account details as JSON.");
  }
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    throw new AuthError(413, "PAYLOAD_TOO_LARGE", "The account request is too large.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new AuthError(400, "INVALID_INPUT", "Enter your account details.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new AuthError(413, "PAYLOAD_TOO_LARGE", "The account request is too large.");
    }
    chunks.push(value);
  }
  try {
    const body = Buffer.concat(chunks).toString("utf8");
    return fields(JSON.parse(body));
  } catch {
    throw new AuthError(400, "INVALID_INPUT", "Send valid account details.");
  }
}

export function readSessionToken(request: Request): string | null {
  const value = request.headers.get("cookie")?.split(";")
    .map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}

export function serializeSessionCookie(token: string | null, expiresAt: number, request: Request): string {
  const secure = new URL(request.url).protocol === "https:";
  return `${SESSION_COOKIE}=${token ?? ""}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? SESSION_SECONDS : 0}; Expires=${new Date(token ? expiresAt : 0).toUTCString()}${secure ? "; Secure" : ""}`;
}

export function authJSON(body: unknown, status = 200, cookie?: string): Response {
  const headers = new Headers({ "Cache-Control": "no-store, private", "Pragma": "no-cache", "Vary": "Cookie" });
  if (cookie) headers.set("Set-Cookie", cookie);
  return Response.json(body, { status, headers });
}

export function authFailure(error: unknown): Response {
  if (error instanceof AuthError) return authJSON({ error: error.message, code: error.code }, error.status);
  console.error("The local account service failed.", error);
  return authJSON({ error: "The account service is unavailable. Please try again.", code: "SERVICE_UNAVAILABLE" }, 503);
}
