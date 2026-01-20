import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Sidebar } from "@/components/app/sidebar";

export default function DashboardPage() {
  return (
    <Sidebar>
      <DashboardShell />
    </Sidebar>
  );
}

