import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = "nutriadm3005";

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = (await request.json()) as unknown;
  } catch {
    body = null;
  }

  const parsed = body as Partial<{ password: string }>;
  const password = typeof parsed.password === "string" ? parsed.password : "";

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const token = Buffer.from(`admin:${Date.now()}`).toString("base64");

  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return NextResponse.json({ ok: true });
}
