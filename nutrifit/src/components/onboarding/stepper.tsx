"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type Step = {
  key: string;
  title: string;
  subtitle: string;
};

export function Stepper({
  steps,
  activeIndex,
}: {
  steps: Step[];
  activeIndex: number;
}) {
  return (
    <div className="rounded-3xl border border-cyber-glass-border bg-cyber-glass/25 p-5 backdrop-blur-xl">
      <div className="text-sm font-semibold tracking-tight">
        Onboarding — Operação: High Performance
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Configure seu perfil e desbloqueie seu modo atleta.
      </div>

      <div className="mt-5 grid gap-3">
        {steps.map((step, idx) => {
          const isActive = idx === activeIndex;
          const isDone = idx < activeIndex;

          return (
            <div
              key={step.key}
              className={cn(
                "relative flex items-start gap-3 rounded-2xl border px-4 py-3",
                "border-cyber-glass-border bg-black/20",
                isActive &&
                  "border-neon-cyan/40 bg-cyber-glass/35 shadow-[0_0_0_1px_rgba(0,245,255,0.12),0_0_30px_rgba(0,245,255,0.08)]",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl border",
                  "border-cyber-glass-border bg-black/20",
                  isDone && "border-neon-green/40 text-neon-green",
                  isActive && "border-neon-cyan/40 text-neon-cyan",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : <span>{idx + 1}</span>}
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight">
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {step.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-xs text-muted-foreground">
        Dica: você pode voltar e ajustar depois. (Por enquanto tudo é salvo só no
        seu navegador.)
      </div>
    </div>
  );
}

