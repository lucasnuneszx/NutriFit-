import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CyberBackground } from "@/components/landing/cyber-background";
import { ArrowLeft, Sparkles, Zap, Shield, Target } from "lucide-react";

export default function RecursosPage() {
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
            Recursos<span className="text-neon-cyan">&</span>Funcionalidades
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tudo que você precisa para sua saúde e performance
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-cyber-glass-border bg-black/30 p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-cyber-glass-border bg-cyber-glass/40">
              <Sparkles className="h-6 w-6 text-neon-cyan" />
            </div>
            <h2 className="text-xl font-semibold">Assistente AI</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sua assistente inteligente com personalidade que conhece seu nome e te motiva todos os dias.
            </p>
          </div>

          <div className="rounded-2xl border border-cyber-glass-border bg-black/30 p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-cyber-glass-border bg-cyber-glass/40">
              <Zap className="h-6 w-6 text-neon-violet" />
            </div>
            <h2 className="text-xl font-semibold">Vision AI</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tira foto da comida e a gente calcula tudo automaticamente. Macros em segundos.
            </p>
          </div>

          <div className="rounded-2xl border border-cyber-glass-border bg-black/30 p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-cyber-glass-border bg-cyber-glass/40">
              <Target className="h-6 w-6 text-neon-green" />
            </div>
            <h2 className="text-xl font-semibold">Treinos Personalizados</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Biblioteca completa de treinos organizados por grupo muscular com progressão.
            </p>
          </div>

          <div className="rounded-2xl border border-cyber-glass-border bg-black/30 p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-cyber-glass-border bg-cyber-glass/40">
              <Shield className="h-6 w-6 text-neon-red" />
            </div>
            <h2 className="text-xl font-semibold">Segurança Total</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sua conta protegida com autenticação segura e dados sempre privados.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
