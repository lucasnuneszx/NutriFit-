"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock, Shield } from "lucide-react";
import { CyberBackground } from "@/components/landing/cyber-background";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean; error: string }>;

      if (!data.ok) {
        setError("Senha incorreta.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <CyberBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/40 p-8 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-violet/5" />
          <div className="relative">
            <div className="flex items-center justify-center mb-6">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-cyber-glass-border bg-black/30">
                <Shield className="h-8 w-8 text-neon-cyan" />
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-center mb-2">
              Acesso Administrativo
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Área restrita do NutriFit+
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha de administrador"
                    className="pl-10 border-cyber-glass-border bg-black/25"
                    autoFocus
                    disabled={loading}
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-neon-red/30 bg-black/25 px-4 py-3 text-sm text-neon-red">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full bg-neon-cyan text-black hover:bg-neon-cyan/90"
                disabled={loading || !password.trim()}
              >
                {loading ? "Verificando..." : "Acessar"}
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
