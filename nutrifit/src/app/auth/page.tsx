import { CyberBackground } from "@/components/landing/cyber-background";
import { AuthPanel } from "@/components/supabase/auth-panel";
import { Suspense } from "react";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen">
      <CyberBackground />
      <div className="mx-auto flex min-h-[calc(100vh-1px)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <AuthPanel />
        </Suspense>
      </div>
    </div>
  );
}

