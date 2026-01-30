"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, Trash2, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CyberBackground } from "@/components/landing/cyber-background";

type PaymentMethod = {
  id: string;
  user_id: string;
  tipo: "credit_card" | "debit_card" | "pix";
  ultimos_digitos: string;
  bandeira?: string;
  valido_ate?: string;
  ativo: boolean;
  criado_em: string;
};

export function PaymentMethodsShell() {
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [cardNumber, setCardNumber] = React.useState("");
  const [cardName, setCardName] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");

  React.useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      // Por enquanto, métodos de pagamento não estão implementados
      // Este componente será atualizado no futuro
      setPaymentMethods([]);
    } catch (error) {
      console.error("Erro ao carregar métodos de pagamento:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!cardNumber || !cardName || !expiryDate) return;

    // Por enquanto, métodos de pagamento não estão implementados
    // Este componente será atualizado no futuro
    alert("Funcionalidade de adicionar cartão será implementada em breve.");
  };

  const handleDeletePaymentMethod = async (id: string) => {
    // Por enquanto, métodos de pagamento não estão implementados
    // Este componente será atualizado no futuro
    alert("Funcionalidade de deletar cartão será implementada em breve.");
  };

  return (
    <div className="relative min-h-screen">
      <CyberBackground />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/perfil" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Métodos de Pagamento
            </h1>
          </div>

          <Card className="border-cyber-glass-border bg-black/40 backdrop-blur-xl">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Seus Cartões</h2>
                <Button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-neon-cyan text-black hover:bg-neon-cyan/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Cartão
                </Button>
              </div>

              {showForm && (
                <div className="mb-6 rounded-lg border border-cyber-glass-border bg-black/30 p-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Nome do Titular</Label>
                      <Input
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Seu Nome Completo"
                        className="border-cyber-glass-border bg-black/25"
                      />
                    </div>
                    <div>
                      <Label>Número do Cartão</Label>
                      <Input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                        placeholder="1234 5678 9012 3456"
                        className="border-cyber-glass-border bg-black/25 font-mono"
                      />
                    </div>
                    <div>
                      <Label>Validade (MM/AA)</Label>
                      <Input
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="12/25"
                        className="border-cyber-glass-border bg-black/25"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddPaymentMethod}
                        className="bg-neon-green text-black hover:bg-neon-green/90"
                      >
                        Salvar Cartão
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowForm(false)}
                        className="border border-cyber-glass-border"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Separator className="my-6 bg-white/10" />

              {loading ? (
                <div className="text-center text-muted-foreground">Carregando...</div>
              ) : paymentMethods.length > 0 ? (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between rounded-lg border border-cyber-glass-border bg-black/20 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-neon-cyan" />
                        <div>
                          <p className="font-semibold">
                            {method.bandeira || "Cartão"} •••• {method.ultimos_digitos}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Validade: {method.valido_ate}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        className="text-neon-red hover:bg-neon-red/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-cyber-glass-border bg-black/20 p-8 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    Nenhum método de pagamento adicionado
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
