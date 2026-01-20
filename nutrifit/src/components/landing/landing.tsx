"use client";

import Image from "next/image";
import { LogIn } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { CyberBackground } from "./cyber-background";
import { Hero } from "./hero";

export function Landing() {
  return (
    <div className="relative min-h-screen">
      <CyberBackground />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Image
            src="https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/public/logos/ss.png"
            alt="NutriFit+ Logo"
            width={100}
            height={100}
            className="h-32 w-32"
          />
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-green bg-clip-text text-transparent">
                NutriFit+
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Saúde&Performance
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild
            variant="ghost"
            className="hidden border border-cyber-glass-border text-muted-foreground hover:bg-cyber-glass/40 hover:text-foreground sm:inline-flex"
          >
            <Link href="/recursos">Recursos</Link>
          </Button>
          <Button asChild
            variant="ghost"
            className="hidden border border-cyber-glass-border text-muted-foreground hover:bg-cyber-glass/40 hover:text-foreground sm:inline-flex"
          >
            <Link href="/demo">Demo</Link>
          </Button>
          <Button className="border border-cyber-glass-border bg-cyber-glass/40 text-foreground backdrop-blur-xl hover:bg-cyber-glass/55">
            <Link href="/auth" className="inline-flex items-center">
              <LogIn className="mr-2 h-4 w-4 text-neon-cyan" />
              Entrar
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <Hero />
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 text-center sm:text-left order-2 sm:order-1">
            <span>© 2026 NutriFit</span>
            <span className="hidden sm:inline">•</span>
            <span>Powered By Lucas Nunes</span>
          </div>
          <Image
            src="https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/public/logos/ss.png"
            alt="NutriFit+ Logo"
            width={50}
            height={50}
            className="h-16 w-16 order-1 sm:order-2"
          />
        </div>
      </footer>
    </div>
  );
}

