import { CyberBackground } from "@/components/landing/cyber-background";
import { DietaCompras } from "@/components/plus/dieta-compras";
import { Sidebar } from "@/components/app/sidebar";

export default function DietaPage() {
  return (
    <Sidebar>
      <div className="relative min-h-screen">
        <CyberBackground />
        <DietaCompras />
      </div>
    </Sidebar>
  );
}

