import { NextResponse } from "next/server";
import { clearAuthToken } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Logout
 * POST /api/auth/logout
 */
export async function POST() {
  await clearAuthToken();
  return NextResponse.json({ ok: true });
}

