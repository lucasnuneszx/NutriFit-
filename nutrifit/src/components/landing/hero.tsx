"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  Dumbbell,
  Flame,
  ScanLine,
  Shield,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { TiltCard } from "./tilt-card";

function Glow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -inset-8 rounded-[inherit] opacity-40 blur-2xl",
        "[background:radial-gradient(60%_60%_at_50%_30%,color-mix(in_oklab,var(--neon-cyan)_35%,transparent),transparent_70%)]",
        className,
      )}
    />
  );
}

function LiveScanCard() {
  return (
    <TiltCard className="group relative" shine>
      <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/60 p-5 backdrop-blur-xl">
        <Glow />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-cyber-glass-border bg-black/20">
              <ScanLine className="h-5 w-5 text-neon-cyan" />
              <div className="absolute -inset-2 rounded-2xl opacity-40 blur-md [background:radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon-cyan)_55%,transparent),transparent_65%)]" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Vision AI Scan
              </div>
            </div>
          </div>
          <Badge className="border-cyber-glass-border bg-black/30 text-neon-green">
            ONLINE
          </Badge>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-2xl border border-cyber-glass-border bg-black/30">
            <div className="absolute inset-0 opacity-70 [background:radial-gradient(600px_circle_at_20%_15%,color-mix(in_oklab,var(--neon-violet)_22%,transparent),transparent_55%),radial-gradient(600px_circle_at_75%_60%,color-mix(in_oklab,var(--neon-cyan)_18%,transparent),transparent_55%)]" />
            <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,var(--cyber-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--cyber-grid)_1px,transparent_1px)] [background-size:28px_28px]" />

            <motion.div
              aria-hidden="true"
              animate={{ y: ["-10%", "110%", "-10%"] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-14 opacity-80 [background:linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--neon-cyan)_40%,transparent),transparent)]"
              style={{
                boxShadow:
                  "0 0 0 1px rgb(255 255 255 / 0.08), 0 0 30px color-mix(in oklab, var(--neon-cyan) 35%, transparent)",
              }}
            />

            <div className="relative p-5">
              <div className="text-xs font-medium tracking-wide text-muted-foreground">
                PRATO DETECTADO
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">
                Bowl Proteico
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="border-cyber-glass-border bg-black/20">
                  frango grelhado
                </Badge>
                <Badge className="border-cyber-glass-border bg-black/20">
                  arroz
                </Badge>
                <Badge className="border-cyber-glass-border bg-black/20">
                  legumes
                </Badge>
                <Badge className="border-cyber-glass-border bg-black/20">
                  azeite
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Macro
              label="Calorias"
              value="610"
              accent="cyan"
              icon={<Flame className="h-4 w-4" />}
            />
            <Macro
              label="Proteína"
              value="46g"
              accent="green"
              icon={<Dumbbell className="h-4 w-4" />}
            />
            <Macro
              label="Carbo"
              value="58g"
              accent="violet"
              icon={<Activity className="h-4 w-4" />}
            />
            <Macro
              label="Gorduras"
              value="18g"
              accent="red"
              icon={<Shield className="h-4 w-4" />}
            />
          </div>
        </div>

        <Separator className="my-4 bg-white/10" />

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="flex items-start gap-3"
        >
          <div className="mt-1 grid h-8 w-8 place-items-center rounded-xl border border-cyber-glass-border bg-black/25">
            <BrainCircuit className="h-4 w-4 text-neon-cyan" />
          </div>
          <div className="text-sm leading-relaxed text-muted-foreground">
            <span className="text-foreground">
              “Mandou bem demais, Lucas!”
            </span>{" "}
            Combustível puro. Quer que eu ajuste isso pro seu objetivo de{" "}
            <span className="text-neon-green">cutting</span>?
          </div>
        </motion.div>
      </Card>
    </TiltCard>
  );
}

function Macro({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "cyan" | "green" | "red" | "violet";
}) {
  const accentClass =
    accent === "cyan"
      ? "text-neon-cyan"
      : accent === "green"
        ? "text-neon-green"
        : accent === "red"
          ? "text-neon-red"
          : "text-neon-violet";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyber-glass-border bg-black/25 p-4">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-12 opacity-40 blur-2xl",
          accent === "cyan"
            ? "[background:radial-gradient(circle_at_25%_25%,color-mix(in_oklab,var(--neon-cyan)_28%,transparent),transparent_55%)]"
            : accent === "green"
              ? "[background:radial-gradient(circle_at_25%_25%,color-mix(in_oklab,var(--neon-green)_22%,transparent),transparent_60%)]"
              : accent === "red"
                ? "[background:radial-gradient(circle_at_25%_25%,color-mix(in_oklab,var(--neon-red)_18%,transparent),transparent_60%)]"
                : "[background:radial-gradient(circle_at_25%_25%,color-mix(in_oklab,var(--neon-violet)_18%,transparent),transparent_60%)]",
        )}
      />

      <div className="relative flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className={cn("grid h-7 w-7 place-items-center", accentClass)}>
          {icon}
        </div>
      </div>
      <div className={cn("relative mt-2 text-2xl font-semibold", accentClass)}>
        {value}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="relative">
          <Badge className="border-cyber-glass-border bg-black/30 text-neon-cyan">
            CYBER‑SPORT • HIGH PERFORMANCE
          </Badge>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-6xl"
          >
            Saúde{" "}
            <span className="bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-green bg-clip-text text-transparent">
              de alta performance
            </span>
            . No modo{" "}
            <span className="text-neon-cyan">insano</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground"
          >
            NutriFit+ combina <span className="text-foreground">Vision AI</span>,{" "}
            gamificação e planos personalizados pra você comer, treinar e
            recuperar como um atleta — com estética{" "}
            <span className="text-foreground">Cyber‑Sport</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="relative overflow-hidden bg-neon-cyan text-black hover:bg-neon-cyan/90"
            >
              <Link href="/onboarding">
                <span className="relative z-10 flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Entrar no modo atleta
                </span>
                <span
                  aria-hidden="true"
                  className="absolute -inset-10 opacity-45 blur-xl [background:radial-gradient(circle_at_center,#fff,transparent_55%)]"
                />
              </Link>
            </Button>
          </motion.div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <MiniStat
              icon={<Flame className="h-4 w-4 text-neon-green" />}
              title="Streaks"
              desc="Dias seguidos no tracking"
            />
            <MiniStat
              icon={<ScanLine className="h-4 w-4 text-neon-cyan" />}
              title="Vision AI"
              desc="Macros em segundos"
            />
            <MiniStat
              icon={<Shield className="h-4 w-4 text-neon-violet" />}
              title="NutriPlus"
              desc="Dieta + treinos"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <LiveScanCard />
        </motion.div>
      </div>

      <BentoFeatures />
    </section>
  );
}

function MiniStat({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-cyber-glass-border bg-cyber-glass/35 px-4 py-3 backdrop-blur-xl">
      <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyber-glass-border bg-black/20">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function BentoFeatures() {
  return (
    <div className="mt-14 grid gap-4 lg:grid-cols-12">
      <FeatureCard
        className="lg:col-span-7"
        title="Bento Dashboard futurista"
        desc="Cards vivos, métricas claras e micro-interações que dão energia."
        icon={<Sparkles className="h-5 w-5 text-neon-cyan" />}
        accent="cyan"
      />
      <FeatureCard
        className="lg:col-span-5"
        title="Assistente com personalidade"
        desc="Nome do usuário + apelido da IA: feedback humano e motivador."
        icon={<BrainCircuit className="h-5 w-5 text-neon-violet" />}
        accent="violet"
      />
      <FeatureCard
        className="lg:col-span-4"
        title="Treinos (NutriPlus)"
        desc="Biblioteca por grupo muscular com mídia e progressão."
        icon={<Dumbbell className="h-5 w-5 text-neon-green" />}
        accent="green"
      />
      <FeatureCard
        className="lg:col-span-4"
        title="Nutrição (Vision AI)"
        desc="Tira foto da comida e a gente calcula tudo automaticamente."
        icon={<ScanLine className="h-5 w-5 text-neon-cyan" />}
        accent="cyan"
      />
      <FeatureCard
        className="lg:col-span-4"
        title="Segurança e consistência"
        desc="Autenticação, limites por plano e upgrade inteligente."
        icon={<Shield className="h-5 w-5 text-neon-red" />}
        accent="red"
      />
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
  accent,
  className,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent: "cyan" | "green" | "red" | "violet";
  className?: string;
}) {
  const glow =
    accent === "cyan"
      ? "[background:radial-gradient(50%_60%_at_15%_20%,color-mix(in_oklab,var(--neon-cyan)_22%,transparent),transparent_60%)]"
      : accent === "green"
        ? "[background:radial-gradient(50%_60%_at_15%_20%,color-mix(in_oklab,var(--neon-green)_18%,transparent),transparent_60%)]"
        : accent === "red"
          ? "[background:radial-gradient(50%_60%_at_15%_20%,color-mix(in_oklab,var(--neon-red)_16%,transparent),transparent_60%)]"
          : "[background:radial-gradient(50%_60%_at_15%_20%,color-mix(in_oklab,var(--neon-violet)_18%,transparent),transparent_60%)]";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-cyber-glass-border bg-cyber-glass/30 p-6 backdrop-blur-xl",
        className,
      )}
    >
      <div aria-hidden="true" className={cn("absolute inset-0 opacity-0 blur-2xl transition-opacity duration-200 group-hover:opacity-100", glow)} />
      <div className="relative flex items-start gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyber-glass-border bg-black/25">
          {icon}
        </div>
        <div>
          <div className="text-base font-semibold tracking-tight">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
        </div>
      </div>
    </motion.div>
  );
}

