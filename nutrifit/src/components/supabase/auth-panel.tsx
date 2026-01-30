"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { 
  CheckCircle2, 
  KeyRound, 
  Mail, 
  Shield, 
  Sparkles, 
  Zap,
  Target,
  TrendingUp,
  Heart
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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

const signupPhrases = [
  "Transforme seu corpo com inteligência artificial",
  "Sua jornada de transformação começa aqui",
  "Alcance seus objetivos com tecnologia de ponta",
  "Nutrição e treino personalizados para você",
];

const loginPhrases = [
  "Bem-vindo de volta! Continue sua transformação",
  "Sua evolução te espera",
  "Volte a conquistar seus objetivos",
  "Pronto para mais uma sessão?",
];

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

  const [currentPhrase, setCurrentPhrase] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => 
        (prev + 1) % (mode === "signup" ? signupPhrases.length : loginPhrases.length)
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [mode]);

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
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: senha }),
        });

        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error || "Erro ao fazer login");
        }

        router.push(next);
        return;
      }

      // Signup
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: senha,
          nome,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      // Criar perfil automaticamente
      await fetch("/api/profile/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draft: { nome, email },
          plan: "free",
        }),
      });

      setMessage("Conta criada com sucesso! Redirecionando...");
      router.push("/dashboard");
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Falha no login/cadastro.");
    } finally {
      setLoading(false);
    }
  };

  const phrases = mode === "signup" ? signupPhrases : loginPhrases;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-lg"
    >
      <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/30 p-6 backdrop-blur-xl sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-24 opacity-60 blur-3xl [background:radial-gradient(60%_55%_at_15%_20%,color-mix(in_oklab,var(--neon-cyan)_22%,transparent),transparent_60%),radial-gradient(60%_55%_at_80%_30%,color-mix(in_oklab,var(--neon-violet)_20%,transparent),transparent_65%)]"
        />

        <div className="relative">
          {/* Logo e Header */}
          <div className="mb-6 flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <Image
                  src="https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/public/logos/ss.png"
                  alt="NutriFit+ Logo"
                  width={64}
                  height={64}
                  className="h-16 w-16 sm:h-20 sm:w-20"
                />
                <motion.div
                  className="absolute -inset-1 rounded-full bg-neon-cyan/20 blur-xl"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="leading-tight">
                <div className="text-xl sm:text-2xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-green bg-clip-text text-transparent">
                    NutriFit+
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Saúde & Performance
                </div>
              </div>
            </motion.div>

            {/* Frase de Efeito Animada */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhrase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p className="text-sm sm:text-base font-medium text-foreground/90">
                  {phrases[currentPhrase]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Features Badges (apenas no signup) */}
          {mode === "signup" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {[
                { icon: Zap, text: "IA Avançada" },
                { icon: Target, text: "Personalizado" },
                { icon: TrendingUp, text: "Resultados" },
                { icon: Heart, text: "Saúde" },
              ].map(({ icon: Icon, text }, idx) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-cyber-glass-border bg-black/20 p-2.5 backdrop-blur-sm"
                >
                  <Icon className="h-4 w-4 text-neon-cyan" />
                  <span className="text-xs text-muted-foreground">{text}</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
            <TabsList className="mb-6 grid w-full grid-cols-2 border border-cyber-glass-border bg-black/30 backdrop-blur-sm">
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-neon-cyan data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-neon-cyan/20"
              >
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Cadastro
              </TabsTrigger>
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-neon-cyan data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-neon-cyan/20"
              >
                <KeyRound className="mr-2 h-3.5 w-3.5" />
                Login
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signup-nome" className="text-sm font-medium">
                    Nome
                  </Label>
                  <Input
                    id="signup-nome"
                    type="text"
                    placeholder="Seu nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1.5 border-cyber-glass-border bg-black/30 backdrop-blur-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/20"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 border-cyber-glass-border bg-black/30 backdrop-blur-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/20"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-senha" className="text-sm font-medium">
                    Senha
                  </Label>
                  <Input
                    id="signup-senha"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="mt-1.5 border-cyber-glass-border bg-black/30 backdrop-blur-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/20"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 border-cyber-glass-border bg-black/30 backdrop-blur-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/20"
                  />
                </div>
                <div>
                  <Label htmlFor="login-senha" className="text-sm font-medium">
                    Senha
                  </Label>
                  <Input
                    id="login-senha"
                    type="password"
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="mt-1.5 border-cyber-glass-border bg-black/30 backdrop-blur-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/20"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-neon-red/30 bg-black/40 px-4 py-3 text-sm text-neon-red backdrop-blur-sm"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-neon-red" />
              {error}
            </motion.div>
          ) : null}

          {message ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-neon-green/30 bg-black/40 px-4 py-3 text-sm text-neon-green backdrop-blur-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </motion.div>
          ) : null}

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="button"
              onClick={submit}
              disabled={loading}
              className="h-12 w-full bg-gradient-to-r from-neon-cyan to-neon-violet text-black shadow-lg shadow-neon-cyan/20 hover:from-neon-cyan/90 hover:to-neon-violet/90 hover:shadow-neon-cyan/30 transition-all"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : mode === "login" ? (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Entrar
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Começar Agora
                </>
              )}
            </Button>
          </motion.div>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-cyber-glass-border bg-black/20 px-4 py-3 text-xs text-muted-foreground backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5 text-neon-cyan" />
            <span>Seus dados estão 100% seguros e criptografados</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
