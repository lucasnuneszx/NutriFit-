import { CyberBackground } from "@/components/landing/cyber-background";
import { TreinosHub } from "@/components/plus/treinos-hub";
import { Sidebar } from "@/components/app/sidebar";

export default function TreinosPage() {
  return (
    <Sidebar>
      <div className="relative min-h-screen">
        <CyberBackground />
        <TreinosHub />
      </div>
    </Sidebar>
  );
}

