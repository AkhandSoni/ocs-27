import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { getAuthStore } from '../src/lib/auth.ts';

// Resolve Next's source alias while exercising the real Web Request/Response handlers.
const authModuleURL = new URL('../src/lib/auth.ts', import.meta.url).href;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === '@/lib/auth' ? authModuleURL : specifier, context);
  },
});

const [registerRoute, loginRoute, sessionRoute, logoutRoute, profilesRoute] = await Promise.all([
  import('../src/app/api/auth/register/route.ts'),
  import('../src/app/api/auth/login/route.ts'),
  import('../src/app/api/auth/session/route.ts'),
  import('../src/app/api/auth/logout/route.ts'),
  import('../src/app/api/auth/profiles/route.ts'),
]);

test('auth API creates, restores, switches, and ends a private account session', async (t) => {
  const originalDirectory = process.cwd();
  const directory = await mkdtemp(path.join(tmpdir(), 'afterhours-auth-routes-'));
  process.chdir(directory);
  t.after(async () => {
    getAuthStore().close();
    process.chdir(originalDirectory);
    hooks.deregister();
    assert.ok(path.resolve(directory).startsWith(path.join(tmpdir(), 'afterhours-auth-routes-')));
    await rm(directory, { recursive: true, force: true });
  });

  function request(endpoint, body, cookie, origin = 'http://localhost:3007') {
    const headers = new Headers({ host: 'localhost:3007', origin, 'sec-fetch-site': 'same-origin' });
    if (body) headers.set('content-type', 'application/json');
    if (cookie) headers.set('cookie', cookie);
    return new Request(`http://0.0.0.0:3007/api/auth/${endpoint}`, {
      method: endpoint === 'session' ? 'GET' : 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  const credentials = { name: 'Jamie', email: 'jamie@example.com', password: 'a-private-evening', avatar: 'horizon' };
  const created = await registerRoute.POST(request('register', credentials));
  assert.equal(created.status, 201);
  const { user } = await created.json();
  assert.equal(user.name, 'Jamie');
  assert.equal(user.avatar, 'horizon');
  const firstCookie = created.headers.get('set-cookie').split(';')[0];
  assert.match(created.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
  assert.match(created.headers.get('cache-control'), /no-store/);
  assert.deepEqual(await (await sessionRoute.GET(request('session', null, firstCookie))).json(), { user });

  const duplicate = await registerRoute.POST(request('register', { ...credentials, email: 'JAMIE@example.COM' }));
  assert.equal(duplicate.status, 409);
  assert.equal((await duplicate.json()).code, 'EMAIL_IN_USE');
  const denied = await loginRoute.POST(request('login', { email: credentials.email, password: 'not-the-password' }));
  assert.equal(denied.status, 401);
  assert.equal((await denied.json()).code, 'INVALID_CREDENTIALS');

  const signedIn = await loginRoute.POST(request('login', credentials, firstCookie));
  assert.equal(signedIn.status, 200);
  const secondCookie = signedIn.headers.get('set-cookie').split(';')[0];
  assert.notEqual(secondCookie, firstCookie);
  assert.deepEqual(await (await sessionRoute.GET(request('session', null, firstCookie))).json(), { user: null });
  assert.deepEqual(await (await sessionRoute.GET(request('session', null, secondCookie))).json(), { user });

  const profiles = await profilesRoute.GET();
  assert.deepEqual(await profiles.json(), { profiles: [] });
  const crossSite = await logoutRoute.POST(request('logout', null, secondCookie, 'https://evil.example'));
  assert.equal(crossSite.status, 403);
  assert.deepEqual(await (await sessionRoute.GET(request('session', null, secondCookie))).json(), { user });
  const signedOut = await logoutRoute.POST(request('logout', null, secondCookie));
  assert.equal(signedOut.status, 200);
  assert.deepEqual(await signedOut.json(), { ok: true });
  assert.match(signedOut.headers.get('set-cookie'), /Max-Age=0/);
  assert.deepEqual(await (await sessionRoute.GET(request('session', null, secondCookie))).json(), { user: null });
});
