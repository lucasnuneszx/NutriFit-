"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, Loader2, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PixPaymentProps {
  amount: number; // Em centavos
  plan: "plus";
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface PaymentData {
  id: string;
  qr_code: string;
  qr_code_url: string;
  copy_paste: string;
  expires_at: string;
  amount: number;
}

export function PixPayment({ amount, plan, onSuccess, onCancel }: PixPaymentProps) {
  const [loading, setLoading] = React.useState(false);
  const [paymentData, setPaymentData] = React.useState<PaymentData | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [checkingStatus, setCheckingStatus] = React.useState(false);
  const [paid, setPaid] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Criar pagamento
  const createPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, amount }),
      });

      // Verificar se a resposta é JSON válido
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        // Se não conseguir fazer parse do JSON, pode ser erro de rede
        throw new Error(
          res.status === 0 || !res.ok
            ? "Erro de conexão. Verifique sua internet e tente novamente."
            : "Erro ao processar resposta do servidor."
        );
      }

      if (!data.ok) {
        // Mensagens de erro mais específicas
        let errorMessage = data.message || data.error || "Erro ao criar pagamento";
        
        if (data.error === "perfect_pay_not_configured") {
          errorMessage = "Perfect Pay não está configurado. Entre em contato com o suporte.";
        } else if (data.error === "profile_not_found") {
          errorMessage = "Perfil não encontrado. Complete seu cadastro primeiro.";
        } else if (data.error === "perfect_pay_error") {
          errorMessage = `Erro na Perfect Pay: ${data.message || "Tente novamente em alguns instantes."}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!data.payment) {
        throw new Error("Resposta inválida do servidor. Tente novamente.");
      }

      setPaymentData(data.payment);
      startStatusCheck(data.payment.id);
    } catch (err) {
      console.error("[PixPayment] Erro ao criar pagamento:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Erro desconhecido. Tente novamente ou entre em contato com o suporte.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Verificar status do pagamento
  const checkStatus = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payment/pix/status?payment_id=${paymentId}`);
      const data = await res.json();

      if (data.ok && data.paid) {
        setPaid(true);
        stopStatusCheck();
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500);
        }
      }
    } catch (err) {
      console.error("Erro ao verificar status:", err);
    }
  };

  // Iniciar polling de status
  const startStatusCheck = (paymentId: string) => {
    setCheckingStatus(true);
    // Verificar a cada 5 segundos
    intervalRef.current = setInterval(() => {
      checkStatus(paymentId);
    }, 5000);
  };

  // Parar polling
  const stopStatusCheck = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCheckingStatus(false);
  };

  // Copiar código PIX
  const copyPixCode = () => {
    if (paymentData?.copy_paste) {
      navigator.clipboard.writeText(paymentData.copy_paste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Limpar ao desmontar
  React.useEffect(() => {
    return () => {
      stopStatusCheck();
    };
  }, []);

  // Formatar valor
  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  // Formatar data de expiração
  const formatExpiresAt = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (paid) {
    return (
      <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-neon-green/20 blur-xl"
            />
            <CheckCircle2 className="h-16 w-16 text-neon-green" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Pagamento Confirmado!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Seu plano NutriPlus foi ativado com sucesso.
            </p>
          </div>
        </motion.div>
      </Card>
    );
  }

  if (!paymentData) {
    return (
      <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Pagamento via PIX</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Valor: <span className="font-semibold text-neon-cyan">{formatAmount(amount)}</span>
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={createPayment}
              disabled={loading}
              className="flex-1 bg-neon-cyan text-black hover:bg-neon-cyan/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Gerar QR Code PIX
                </>
              )}
            </Button>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel} className="border border-cyber-glass-border">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Pague com PIX</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Escaneie o QR Code ou copie o código
            </p>
          </div>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0 border border-cyber-glass-border"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="relative rounded-2xl border-2 border-cyber-glass-border bg-white p-4">
            {paymentData.qr_code_url ? (
              <img
                src={paymentData.qr_code_url}
                alt="QR Code PIX"
                className="h-64 w-64"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center text-muted-foreground">
                QR Code não disponível
              </div>
            )}
          </div>
        </div>

        {/* Código PIX para copiar */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Código PIX (Copiar e Colar)</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={paymentData.copy_paste}
              className="flex-1 rounded-lg border border-cyber-glass-border bg-black/25 px-4 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            />
            <Button
              onClick={copyPixCode}
              variant="ghost"
              size="sm"
              className={cn(
                "border border-cyber-glass-border",
                copied && "bg-neon-green/20 text-neon-green",
              )}
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 rounded-lg border border-cyber-glass-border bg-black/20 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-semibold text-foreground">{formatAmount(paymentData.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expira em:</span>
            <span className="font-semibold text-foreground">{formatExpiresAt(paymentData.expires_at)}</span>
          </div>
        </div>

        {/* Status de verificação */}
        {checkingStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-lg border border-cyber-glass-border bg-black/20 p-3 text-sm"
          >
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
            <span className="text-muted-foreground">Aguardando pagamento...</span>
          </motion.div>
        )}
      </div>
    </Card>
  );
}

