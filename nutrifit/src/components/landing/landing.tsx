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

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-4 sm:pt-6 lg:pt-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src="https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/public/logos/ss.png"
            alt="NutriFit+ Logo"
            width={100}
            height={100}
            className="h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32"
          />
          <div className="leading-tight">
            <div className="text-base sm:text-lg font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-green bg-clip-text text-transparent">
                NutriFit+
              </span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Saúde&Performance
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button asChild
            variant="ghost"
            size="sm"
            className="hidden border border-cyber-glass-border text-muted-foreground hover:bg-cyber-glass/40 hover:text-foreground sm:inline-flex text-xs sm:text-sm"
          >
            <Link href="/recursos">Recursos</Link>
          </Button>
          <Button asChild
            variant="ghost"
            size="sm"
            className="hidden border border-cyber-glass-border text-muted-foreground hover:bg-cyber-glass/40 hover:text-foreground sm:inline-flex text-xs sm:text-sm"
          >
            <Link href="/demo">Demo</Link>
          </Button>
          <Button size="sm" className="border border-cyber-glass-border bg-cyber-glass/40 text-foreground backdrop-blur-xl hover:bg-cyber-glass/55 text-xs sm:text-sm">
            <Link href="/auth" className="inline-flex items-center">
              <LogIn className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-neon-cyan" />
              <span className="hidden sm:inline">Entrar</span>
              <span className="sm:hidden">→</span>
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

