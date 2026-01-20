import { CyberBackground } from "@/components/landing/cyber-background";
import { VerifyGate } from "@/components/supabase/verify-gate";

export default function VerifyPage() {
  return (
    <div className="relative min-h-screen">
      <CyberBackground />
      <VerifyGate />
    </div>
  );
}

