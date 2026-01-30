"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CyberBackground } from "@/components/landing/cyber-background";
import { PixPayment } from "@/components/payment/pix-payment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { setPlan } from "@/components/app/local-profile";

export default function CheckoutPage() {
  const router = useRouter();
  const [userName, setUserName] = React.useState("Atleta");
  const [loading, setLoading] = React.useState(true);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.ok || !data.user) {
          router.push("/auth?next=/checkout");
          return;
        }

        // Buscar perfil completo
        const profileRes = await fetch("/api/profile/me");
        const profileData = await profileRes.json();

        if (profileData.ok && profileData.profile?.nome) {
          setUserName(profileData.profile.nome);
        } else if (data.user.nome) {
          setUserName(data.user.nome);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        router.push("/auth?next=/checkout");
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [router]);

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    // Atualizar o plano do usuário no banco de dados para 'plus'
    try {
      await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tipo_plano: "plus" }),
      });
      setPlan("plus"); // Atualiza o estado local do plano
    } catch (error) {
      console.error("Erro ao atualizar plano após pagamento:", error);
    }

    // Redirecionar para o dashboard após um pequeno delay
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <CyberBackground />
        <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl text-center">
          <h2 className="text-2xl font-semibold text-neon-cyan">Carregando Checkout...</h2>
          <p className="text-muted-foreground mt-2">Preparando sua experiência NutriPlus.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <CyberBackground />
      <div className="mx-auto flex min-h-[calc(100vh-1px)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-24 opacity-55 blur-3xl [background:radial-gradient(60%_55%_at_15%_20%,color-mix(in_oklab,var(--neon-cyan)_18%,transparent),transparent_60%),radial-gradient(60%_55%_at_80%_30%,color-mix(in_oklab,var(--neon-violet)_16%,transparent),transparent_65%)]"
            />

            <div className="relative">
              <Button
                variant="ghost"
                className="absolute -top-4 -left-4 border border-cyber-glass-border text-muted-foreground hover:bg-cyber-glass/40 hover:text-foreground"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <h2 className="text-center text-3xl font-semibold tracking-tight text-neon-green">
                Checkout NutriPlus
              </h2>
              <p className="text-center text-muted-foreground mt-2">
                Finalize sua assinatura para desbloquear todos os recursos.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-sm">
                  <div className="text-xs font-medium tracking-wide text-muted-foreground">
                    SEU PLANO
                  </div>
                  <div className="mt-2 text-xl font-semibold text-neon-cyan">
                    NutriPlus
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Scans ilimitados, dieta personalizada, biblioteca de treinos e lista de compras.
                  </p>
                  <div className="mt-3 text-2xl font-bold text-neon-green">
                    R$ 39,99 <span className="text-base text-muted-foreground">/ mês</span>
                  </div>
                </div>

                {!paymentSuccess ? (
                  <PixPayment
                    amount={3999} // Valor em centavos (R$ 39,99)
                    description="Assinatura NutriPlus Mensal"
                    customerName={userName}
                    customerEmail="" // O email será preenchido no componente PixPayment
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                ) : (
                  <div className="rounded-2xl border border-neon-green/30 bg-black/20 p-4 text-center">
                    <Sparkles className="h-8 w-8 text-neon-green mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-neon-green">Pagamento Confirmado!</h3>
                    <p className="text-muted-foreground mt-1">
                      Seu plano NutriPlus foi ativado. Redirecionando para o dashboard...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
