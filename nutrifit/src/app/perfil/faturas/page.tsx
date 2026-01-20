import { Sidebar } from "@/components/app/sidebar";
import { BillingHistoryShell } from "@/components/profile/billing-history-shell";

export default function BillingHistoryPage() {
  return (
    <Sidebar>
      <BillingHistoryShell />
    </Sidebar>
  );
}
