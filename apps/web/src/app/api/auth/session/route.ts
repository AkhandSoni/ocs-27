import { authFailure, authJSON, getAuthStore, readSessionToken, serializeSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = readSessionToken(request);
    const user = getAuthStore().getSession(token);
    return authJSON({ user }, 200, token && !user ? serializeSessionCookie(null, 0, request) : undefined);
  } catch (error) { return authFailure(error); }
}
