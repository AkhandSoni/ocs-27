import { assertSameOrigin, authFailure, authJSON, getAuthStore, readAuthBody, readSessionToken, serializeSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readAuthBody(request);
    const store = getAuthStore();
    const session = await store.register(body);
    store.logout(readSessionToken(request));
    return authJSON({ user: session.user }, 201, serializeSessionCookie(session.token, session.expiresAt, request));
  } catch (error) { return authFailure(error); }
}
