"use client";

import * as React from "react";
import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";

import { setPlan, type PlanType } from "@/components/app/local-profile";
import { UpgradeModal } from "@/components/dashboard/upgrade-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type MeResponse = {
  ok: boolean;
  profile: null | {
    nome: string | null;
    email: string | null;
    tipo_plano: "free" | "plus" | null;
  };
};

export function PlusGate({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [plan, setPlanState] = React.useState<PlanType>("free");
  const [userName, setUserName] = React.useState("Atleta");
  const [ready, setReady] = React.useState(false);
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/profile/me");
        if (res.status === 401) {
          window.location.href = "/auth?next=" + encodeURIComponent(window.location.pathname);
          return;
        }
        const json = (await res.json()) as unknown;
        const data = json as Partial<MeResponse>;
        const p = data.profile;
        if (p) {
          setPlanState(p.tipo_plano === "plus" ? "plus" : "free");
          setUserName(p.nome || "Atleta");
        }
      } finally {
        setReady(true);
      }
    };
    void load();
  }, []);

  const onChoosePlan = (p: PlanType) => {
    void (async () => {
      setPlan(p);
      setPlanState(p);
      setShowUpgrade(false);
      try {
        await fetch("/api/profile/plan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ plan: p }),
        });
      } catch {
        // ignore
      }
    })();
  };

  if (!ready) {
    return (
      <Card className="border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </Card>
    );
  }

  if (plan !== "plus") {
    return (
      <>
        <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-24 opacity-55 blur-3xl [background:radial-gradient(60%_55%_at_15%_20%,color-mix(in_oklab,var(--neon-green)_14%,transparent),transparent_60%),radial-gradient(60%_55%_at_80%_30%,color-mix(in_oklab,var(--neon-cyan)_14%,transparent),transparent_65%)]"
          />
          <div className="relative">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-11 w-11 place-items-center rounded-2xl border border-cyber-glass-border bg-black/25">
                <Lock className="h-5 w-5 text-neon-red" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-semibold tracking-tight">
                  {title} (NutriPlus)
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {description}
                </div>
              </div>
            </div>

            <Separator className="my-6 bg-white/10" />

            <div className="rounded-3xl border border-cyber-glass-border bg-black/20 p-5 text-sm text-muted-foreground">
              <div>
                {userName}, isso faz parte do{" "}
                <span className="text-neon-green">NutriPlus</span>: biblioteca de
                treinos, dieta personalizada e lista de compras.
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => setShowUpgrade(true)}
                className="h-11 bg-neon-green text-black hover:bg-neon-green/90"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Desbloquear NutriPlus
              </Button>

              <Button
                variant="secondary"
                className="h-11 border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                asChild
              >
                <Link href="/dashboard">Voltar ao dashboard</Link>
              </Button>
            </div>
          </div>
        </Card>

        <UpgradeModal
          open={showUpgrade}
          userName={userName}
          onChoose={onChoosePlan}
          onClose={() => setShowUpgrade(false)}
        />
      </>
    );
  }

  return <>{children}</>;
}

