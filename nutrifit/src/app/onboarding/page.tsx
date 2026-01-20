import { CyberBackground } from "@/components/landing/cyber-background";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen">
      <CyberBackground />
      <OnboardingFlow />
    </div>
  );
}

