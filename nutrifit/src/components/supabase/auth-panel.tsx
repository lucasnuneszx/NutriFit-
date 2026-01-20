"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { z } from "zod";
import { CheckCircle2, KeyRound, Mail, Shield, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

const signupSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8),
});

export function AuthPanel() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [mode, setMode] = React.useState<"login" | "signup">("signup");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [senha, setSenha] = React.useState("");

  const submit = async () => {
    setError(null);
    setMessage(null);

    const data = { nome, email, senha };
    const parsed =
      mode === "login" ? loginSchema.safeParse(data) : signupSchema.safeParse(data);
    if (!parsed.success) {
      setError("Confira seus dados e tente novamente.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error: e } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (e) throw e;
        router.push(next);
        return;
      }

      const origin = window.location.origin;
      const { error: e } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            nome,
          },
        },
      });
      if (e) throw e;

      setMessage(
        "Conta criada. Agora verifique seu email — quando confirmar, você volta automaticamente e segue o fluxo.",
      );
      router.push("/verify");
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Falha no login/cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-1px)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-24 opacity-55 blur-3xl [background:radial-gradient(60%_55%_at_15%_20%,color-mix(in_oklab,var(--neon-cyan)_18%,transparent),transparent_60%),radial-gradient(60%_55%_at_80%_30%,color-mix(in_oklab,var(--neon-violet)_16%,transparent),transparent_65%)]"
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyber-glass-border bg-black/30 px-3 py-1 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-neon-cyan" />
              Supabase Auth • Secure Mode
            </div>

            <div className="mt-4 text-2xl font-semibold tracking-tight">
              Entrar no{" "}
              <span className="bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-green bg-clip-text text-transparent">
                NutriFit+
              </span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Acesso de atleta. Email verificado = oferta liberada.
            </div>

            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v === "login" ? "login" : "signup")}
              className="mt-6"
            >
              <TabsList className="grid w-full grid-cols-2 bg-black/25">
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
                <TabsTrigger value="login">Login</TabsTrigger>
              </TabsList>

              <TabsContent value="signup" className="mt-5">
                <div className="grid gap-4">
                  <Field label="Nome" icon={<Sparkles className="h-4 w-4 text-neon-violet" />}>
                    <Input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Lucas"
                      className="border-cyber-glass-border bg-black/25"
                    />
                  </Field>
                  <Field label="Email" icon={<Mail className="h-4 w-4 text-neon-cyan" />}>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
                      className="border-cyber-glass-border bg-black/25"
                    />
                  </Field>
                  <Field
                    label="Senha"
                    icon={<KeyRound className="h-4 w-4 text-neon-green" />}
                    hint="Mín. 8 caracteres"
                  >
                    <Input
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      type="password"
                      placeholder="••••••••"
                      className="border-cyber-glass-border bg-black/25"
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="login" className="mt-5">
                <div className="grid gap-4">
                  <Field label="Email" icon={<Mail className="h-4 w-4 text-neon-cyan" />}>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
                      className="border-cyber-glass-border bg-black/25"
                    />
                  </Field>
                  <Field label="Senha" icon={<KeyRound className="h-4 w-4 text-neon-green" />}>
                    <Input
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      type="password"
                      placeholder="••••••••"
                      className="border-cyber-glass-border bg-black/25"
                    />
                  </Field>
                </div>
              </TabsContent>
            </Tabs>

            {error ? (
              <div className="mt-5 rounded-2xl border border-neon-red/30 bg-black/30 px-4 py-3 text-sm text-neon-red">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-2xl border border-neon-green/25 bg-black/25 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-neon-green" />
                  <div>{message}</div>
                </div>
              </div>
            ) : null}

            <Button
              onClick={submit}
              disabled={loading}
              className={cn(
                "mt-6 h-12 w-full",
                mode === "login"
                  ? "bg-neon-cyan text-black hover:bg-neon-cyan/90"
                  : "bg-neon-green text-black hover:bg-neon-green/90",
              )}
            >
              {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>

            <div className="mt-4 text-xs text-muted-foreground">
              Ao continuar, você concorda com uma experiência gamificada de alto desempenho.
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-end justify-between gap-4">
        <Label className="text-sm">{label}</Label>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-80">
          {icon}
        </div>
        <div className="[&>input]:pl-10">{children}</div>
      </div>
    </div>
  );
}

