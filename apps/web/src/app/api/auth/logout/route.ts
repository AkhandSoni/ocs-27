import { assertSameOrigin, authFailure, authJSON, getAuthStore, readSessionToken, serializeSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    getAuthStore().logout(readSessionToken(request));
    return authJSON({ ok: true }, 200, serializeSessionCookie(null, 0, request));
  } catch (error) { return authFailure(error); }
}
