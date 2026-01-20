import { Sidebar } from "@/components/app/sidebar";
import { PaymentMethodsShell } from "@/components/profile/payment-methods-shell";

export default function PaymentMethodsPage() {
  return (
    <Sidebar>
      <PaymentMethodsShell />
    </Sidebar>
  );
}
