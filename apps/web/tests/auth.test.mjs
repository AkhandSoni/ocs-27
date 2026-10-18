import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  AuthError,
  assertSameOrigin,
  createAuthStore,
  readAuthBody,
  serializeSessionCookie,
} from '../src/lib/auth.ts';

async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'afterhours-auth-'));
  const databasePath = path.join(directory, 'console.sqlite');
  let store = createAuthStore(databasePath);
  t.after(async () => {
    store.close();
    assert.ok(path.resolve(directory).startsWith(path.join(tmpdir(), 'afterhours-auth-')));
    await rm(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    get store() { return store; },
    reopen() { store.close(); store = createAuthStore(databasePath); },
  };
}

const registration = {
  name: ' Jamie ',
  email: ' JAMIE@Example.com ',
  password: 'evenings-are-mine',
  avatar: 'cosmic',
};

test('registration creates a persistent authenticated account without storing the password or session token', async (t) => {
  const f = await fixture(t);
  const session = await f.store.register(registration);
  assert.equal(session.user.name, 'Jamie');
  assert.equal(session.user.email, 'jamie@example.com');
  assert.equal(session.user.avatar, 'cosmic');
  assert.deepEqual(Object.keys(session.user).sort(), ['avatar', 'email', 'id', 'name']);
  assert.deepEqual(f.store.getSession(session.token), session.user);
  const db = new DatabaseSync(f.databasePath);
  const row = db.prepare('SELECT password_hash, password_salt FROM users').get();
  assert.notEqual(row.password_hash, registration.password);
  assert.ok(row.password_hash.length >= 64);
  assert.ok(row.password_salt.length >= 32);
  const storedToken = db.prepare('SELECT token_hash FROM sessions').get().token_hash;
  assert.notEqual(storedToken, session.token);
  db.close();
  f.reopen();
  assert.deepEqual(f.store.getSession(session.token), session.user);
});

test('simultaneous case-insensitive registration creates only one account', async (t) => {
  const f = await fixture(t);
  const results = await Promise.allSettled([
    f.store.register(registration),
    f.store.register({ ...registration, email: 'jamie@example.COM' }),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const failure = results.find((result) => result.status === 'rejected').reason;
  assert.equal(failure.code, 'EMAIL_IN_USE');
  assert.equal(failure.status, 409);
  const db = new DatabaseSync(f.databasePath);
  assert.equal(db.prepare('SELECT count(*) AS total FROM users').get().total, 1);
  assert.equal(db.prepare('SELECT count(*) AS total FROM sessions').get().total, 1);
  db.close();
});

test('login validates the password and hides whether the account exists', async (t) => {
  const f = await fixture(t);
  const registered = await f.store.register(registration);
  const loggedIn = await f.store.login({ email: 'JAMIE@example.com', password: registration.password });
  assert.equal(loggedIn.user.id, registered.user.id);
  assert.notEqual(loggedIn.token, registered.token);
  for (const email of ['jamie@example.com', 'nobody@example.com']) {
    await assert.rejects(f.store.login({ email, password: 'incorrect-password' }), (error) => {
      assert.ok(error instanceof AuthError);
      assert.equal(error.status, 401);
      assert.equal(error.code, 'INVALID_CREDENTIALS');
      assert.equal(error.message, 'Invalid email or password.');
      return true;
    });
  }
});

test('logout and server-side expiry both invalidate persisted sessions', async (t) => {
  const f = await fixture(t);
  const first = await f.store.register(registration);
  f.store.logout(first.token);
  assert.equal(f.store.getSession(first.token), null);
  const second = await f.store.login({ email: registration.email, password: registration.password });
  const db = new DatabaseSync(f.databasePath);
  db.prepare('UPDATE sessions SET expires_at = ?').run(Date.now() - 1000);
  db.close();
  assert.equal(f.store.getSession(second.token), null);
  assert.equal(f.store.getSession('malformed-token'), null);
});

test('registration rejects invalid fields and defaults to the Astro avatar', async (t) => {
  const f = await fixture(t);
  for (const invalid of [
    { ...registration, name: 'J' },
    { ...registration, name: 'J'.repeat(25) },
    { ...registration, email: 'not-an-email' },
    { ...registration, password: 'short' },
    { ...registration, password: 'x'.repeat(129) },
    { ...registration, avatar: 'https://example.com/avatar.svg' },
  ]) {
    await assert.rejects(f.store.register(invalid), (error) => error.status === 400);
  }
  const session = await f.store.register({ ...registration, avatar: undefined });
  assert.equal(session.user.avatar, 'astro');
});

test('mutation origin checks reject cross-site and missing origins', () => {
  assert.doesNotThrow(() => assertSameOrigin(new Request('http://localhost:3000/api/auth/login', {
    headers: { origin: 'http://localhost:3000' },
  })));
  for (const origin of ['https://evil.example', 'null', undefined]) {
    assert.throws(() => assertSameOrigin(new Request('http://localhost:3000/api/auth/login', {
      headers: origin ? { origin } : {},
    })), (error) => error.status === 403);
  }
});

test('origin checks accept the browser Host when Next uses its internal bind hostname', () => {
  assert.doesNotThrow(() => assertSameOrigin(new Request('http://0.0.0.0:3007/api/auth/register', {
    headers: { host: 'localhost:3007', origin: 'http://localhost:3007', 'sec-fetch-site': 'same-origin' },
  })));
  assert.throws(() => assertSameOrigin(new Request('http://0.0.0.0:3007/api/auth/register', {
    headers: { host: 'localhost:3007', origin: 'http://evil.example', 'sec-fetch-site': 'cross-site' },
  })), (error) => error.status === 403);
});

test('auth request bodies reject oversized payloads and malformed JSON', async () => {
  for (const [body, status] of [['x'.repeat(4097), 413], ['{', 400], ['[]', 400]]) {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body,
    });
    await assert.rejects(readAuthBody(request), (error) => error.status === status);
  }
});

test('session cookies are private, expire in thirty days, and become secure over HTTPS', () => {
  const cookie = serializeSessionCookie('a'.repeat(64), Date.now() + 30 * 86400000, new Request('https://lounge.example'));
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Max-Age=2592000/i);
  assert.match(cookie, /Path=\//i);
  assert.match(cookie, /Secure/i);
  assert.doesNotMatch(cookie, /Domain=/i);
});
