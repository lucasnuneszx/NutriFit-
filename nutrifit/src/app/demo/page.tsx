import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CyberBackground } from "@/components/landing/cyber-background";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="relative min-h-screen">
      <CyberBackground />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Demo da IA
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Veja como a assistente inteligente funciona na prática
          </p>
        </div>

        <div className="rounded-2xl border border-cyber-glass-border bg-black/30 p-8 backdrop-blur-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-cyber-glass-border bg-cyber-glass/40">
              <Sparkles className="h-6 w-6 text-neon-cyan" />
            </div>
            <h2 className="text-2xl font-semibold">Conheça sua Assistente</h2>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-black/40 p-4 border border-cyber-glass-border">
              <p className="text-sm font-semibold text-neon-cyan">Assistente:</p>
              <p className="mt-2 text-muted-foreground">
                Oi! Sou sua assistente de saúde e performance. Vou te ajudar a alcançar seus objetivos com treinos inteligentes, nutrição personalizada e muito motivação!
              </p>
            </div>

            <div className="rounded-lg bg-black/40 p-4 border border-cyber-glass-border">
              <p className="text-sm font-semibold text-neon-green">Você:</p>
              <p className="mt-2 text-muted-foreground">
                Quero ganhar massa muscular, mas não tenho muito tempo para treinar.
              </p>
            </div>

            <div className="rounded-lg bg-black/40 p-4 border border-cyber-glass-border">
              <p className="text-sm font-semibold text-neon-cyan">Assistente:</p>
              <p className="mt-2 text-muted-foreground">
                Perfeito! Vou criar um programa de treino eficiente de 45 minutos, 4x por semana, focado em ganho de massa. Vamos começar com a sua bio para personalizar tudo?
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="bg-neon-cyan text-black hover:bg-neon-cyan/90">
              <Link href="/onboarding" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Começar com a IA
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
