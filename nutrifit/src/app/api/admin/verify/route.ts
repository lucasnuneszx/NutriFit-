import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token || !token.value) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }

  try {
    const decoded = Buffer.from(token.value, "base64").toString("utf-8");
    if (!decoded.startsWith("admin:")) {
      return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true, authenticated: true });
}
