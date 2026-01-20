import { cookies } from "next/headers";

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token || !token.value) {
    return false;
  }

  try {
    const decoded = Buffer.from(token.value, "base64").toString("utf-8");
    return decoded.startsWith("admin:");
  } catch {
    return false;
  }
}
