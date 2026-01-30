"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MailCheck, Sparkles } from "lucide-react";

import { setPlan } from "@/components/app/local-profile";
import { OfferModal } from "@/components/onboarding/offer-modal";
import { loadDraft } from "@/components/onboarding/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";

export function VerifyGate() {
  const router = useRouter();
  const [email, setEmail] = React.useState<string>("");
  const [userName, setUserName] = React.useState<string>("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [showOffer, setShowOffer] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const tick = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        const user = data.user;
        if (!user) {
          // Sem sessão: o usuário ainda não clicou no link.
          return;
        }

        if (cancelled) return;
        setEmail(user.email ?? "");
        const meta = user.user_metadata as Record<string, unknown>;
        setUserName(typeof meta?.nome === "string" ? meta.nome : "");

        const confirmedAt =
          "email_confirmed_at" in user && typeof user.email_confirmed_at === "string"
            ? user.email_confirmed_at
            : null;
        if (confirmedAt) {
          setConfirmed(true);
          setShowOffer(true);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(getErrorMessage(e) || "Erro ao verificar sessão.");
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 1500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const bootstrap = async (plan: "free" | "plus") => {
    setSaving(true);
    try {
      const draft = loadDraft();
      await fetch("/api/profile/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draft, plan }),
      });
    } finally {
      setSaving(false);
    }
  };

  const accept = async () => {
    // Redirecionar para checkout ao invés de setar plano direto
    setShowOffer(false);
    router.push("/checkout");
  };

  const decline = async () => {
    // Se recusar, vai direto pro dashboard com plano free
    setPlan("free");
    await bootstrap("free");
    setShowOffer(false);
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-1px)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl"
      >
        <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-24 opacity-55 blur-3xl [background:radial-gradient(60%_55%_at_15%_20%,color-mix(in_oklab,var(--neon-cyan)_18%,transparent),transparent_60%),radial-gradient(60%_55%_at_80%_30%,color-mix(in_oklab,var(--neon-violet)_16%,transparent),transparent_65%)]"
          />

          <div className="relative">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-11 w-11 place-items-center rounded-2xl border border-cyber-glass-border bg-black/25">
                <MailCheck className="h-5 w-5 text-neon-cyan" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-semibold tracking-tight">
                  Verificando seu email…
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Assim que você confirmar, eu libero a oferta e te jogo direto pro
                  dashboard.
                </div>
              </div>
            </div>

            <Separator className="my-6 bg-white/10" />

            <div className="grid gap-3 rounded-3xl border border-cyber-glass-border bg-black/20 p-5">
              <div className="text-xs font-medium tracking-wide text-muted-foreground">
                STATUS
              </div>

              <div className="text-sm text-muted-foreground">
                Email:{" "}
                <span className="text-foreground">{email || "—"}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="relative h-2 w-2 rounded-full bg-neon-cyan">
                  <div className="absolute -inset-2 rounded-full opacity-60 blur-sm [background:radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon-cyan)_55%,transparent),transparent_65%)]" />
                </div>
                {confirmed ? "Verificado. Oferta liberada." : "Aguardando confirmação…"}
              </div>

              <motion.div
                aria-hidden="true"
                className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10"
              >
                <motion.div
                  className="h-full w-1/2 bg-neon-cyan/80"
                  animate={{ x: ["-30%", "130%", "-30%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-neon-red/30 bg-black/30 px-4 py-3 text-sm text-neon-red">
                {error}
              </div>
            ) : null}

            <div className="mt-6">
              <Button
                variant="secondary"
                className="w-full border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                onClick={() => router.push("/auth")}
              >
                Voltar pro login
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <OfferModal
        open={showOffer}
        userName={userName}
        onAccept={accept}
        onDecline={decline}
      />
    </div>
  );
}

