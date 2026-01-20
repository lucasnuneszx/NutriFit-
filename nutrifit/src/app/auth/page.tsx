import { CyberBackground } from "@/components/landing/cyber-background";
import { AuthPanel } from "@/components/supabase/auth-panel";
import { Suspense } from "react";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen">
      <CyberBackground />
      <Suspense fallback={null}>
        <AuthPanel />
      </Suspense>
    </div>
  );
}

