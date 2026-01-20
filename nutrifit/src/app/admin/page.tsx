import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const admin = await isAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
