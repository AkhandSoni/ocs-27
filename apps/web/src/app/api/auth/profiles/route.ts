import { authJSON } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Profile hints belong to the current browser. Never enumerate server accounts.
export async function GET() {
  return authJSON({ profiles: [] });
}
