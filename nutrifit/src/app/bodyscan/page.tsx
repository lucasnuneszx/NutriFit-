import { CyberBackground } from "@/components/landing/cyber-background";
import { BodyScanHub } from "@/components/plus/bodyscan-hub";
import { Sidebar } from "@/components/app/sidebar";

export default function BodyScanPage() {
  return (
    <Sidebar>
      <div className="relative min-h-screen">
        <CyberBackground />
        <BodyScanHub />
      </div>
    </Sidebar>
  );
}
