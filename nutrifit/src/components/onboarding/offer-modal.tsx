"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PixPayment } from "@/components/payment/pix-payment";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeLeft(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

export function OfferModal({
  open,
  userName,
  onAccept,
  onDecline,
}: {
  open: boolean;
  userName: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = React.useState(10 * 60);
  const [showPayment, setShowPayment] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setSecondsLeft(10 * 60);
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open]);

  // Forçar renderização quando open mudar
  React.useEffect(() => {
    if (open) {
      // Garantir que o modal apareça no topo
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ y: 18, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/30 p-6 backdrop-blur-xl sm:p-10">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-24 opacity-60 blur-3xl [background:radial-gradient(70%_60%_at_30%_20%,color-mix(in_oklab,var(--neon-cyan)_26%,transparent),transparent_60%),radial-gradient(70%_60%_at_70%_40%,color-mix(in_oklab,var(--neon-violet)_22%,transparent),transparent_65%),radial-gradient(70%_60%_at_60%_90%,color-mix(in_oklab,var(--neon-green)_18%,transparent),transparent_65%)]"
                />

                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyber-glass-border bg-black/30 px-3 py-1 text-xs text-muted-foreground">
                      <Timer className="h-4 w-4 text-neon-cyan" />
                      Oferta expira em{" "}
                      <span className="font-semibold text-neon-cyan">
                        {formatTimeLeft(secondsLeft)}
                      </span>
                    </div>

                    <div className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                      OFERTA DESBLOQUEADA PARA{" "}
                      <span className="bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-green bg-clip-text text-transparent">
                        {userName || "VOCÊ"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end gap-3">
                      <div className="text-lg font-semibold text-neon-red line-through">
                        R$ 99,99
                      </div>
                      <div className="text-4xl font-semibold tracking-tight text-neon-green sm:text-5xl">
                        R$ 39,99{" "}
                        <span className="text-base text-muted-foreground">
                          / mês
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Equivalente a <span className="text-foreground">R$ 1,33</span>{" "}
                      por dia.
                    </div>
                  </div>

                  <div className="grid w-full gap-3 lg:max-w-md">
                    <div className="grid gap-3 rounded-3xl border border-cyber-glass-border bg-black/25 p-5">
                      <div className="text-sm font-semibold tracking-tight">
                        Comparativo de planos
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <PlanCard
                          title="Free"
                          bullets={[
                            "3 scans/semana",
                            "Sem plano de dieta",
                            "Sem treino",
                          ]}
                          accent="muted"
                        />
                        <PlanCard
                          title="NutriPlus"
                          bullets={[
                            "Scans ilimitados",
                            "Dieta personalizada",
                            "Biblioteca de treinos",
                            "Lista de compras",
                          ]}
                          accent="green"
                        />
                      </div>
                    </div>

                    <motion.div
                      animate={{ boxShadow: ["0 0 0 rgba(0,0,0,0)", "0 0 60px rgba(57,255,136,0.12)", "0 0 0 rgba(0,0,0,0)"] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      className="rounded-3xl"
                    >
                      <Button
                        onClick={() => {
                          // Redirecionar para checkout ao invés de mostrar pagamento no modal
                          window.location.href = "/checkout";
                        }}
                        size="lg"
                        className="h-12 w-full bg-neon-green text-black hover:bg-neon-green/90"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        QUERO EVOLUIR AGORA (R$ 39,99)
                      </Button>
                    </motion.div>

                    <button
                      type="button"
                      onClick={onDecline}
                      className="mx-auto text-xs text-muted-foreground hover:text-foreground"
                    >
                      Prefiro resultados lentos e limitados.
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function PlanCard({
  title,
  bullets,
  accent,
}: {
  title: string;
  bullets: string[];
  accent: "muted" | "green";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-cyber-glass-border bg-black/20 p-4",
        accent === "green" &&
          "border-neon-green/30 shadow-[0_0_0_1px_rgba(57,255,136,0.10)]",
      )}
    >
      <div
        className={cn(
          "text-sm font-semibold tracking-tight",
          accent === "green" ? "text-neon-green" : "text-foreground",
        )}
      >
        {title}
      </div>
      <ul className="mt-2 grid gap-1 text-xs text-muted-foreground">
        {bullets.map((b) => (
          <li key={b}>- {b}</li>
        ))}
      </ul>
    </div>
  );
}

