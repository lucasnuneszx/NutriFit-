"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MailCheck,
  Sparkles,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { setPlan } from "@/components/app/local-profile";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { OfferModal } from "./offer-modal";
import { loadDraft, saveDraft } from "./storage";
import { Stepper, type Step } from "./stepper";
import {
  defaultDraft,
  medicalConditionsCatalog,
  type ActivityLevel,
  type Gender,
  type MedicalConditionKey,
  type OnboardingDraft,
} from "./types";

type StepKey = "account" | "biometrics" | "medical" | "assistant" | "verify";

const steps: Step[] = [
  {
    key: "account",
    title: "Cadastro",
    subtitle: "Email, senha e nome.",
  },
  {
    key: "biometrics",
    title: "Biometria",
    subtitle: "Altura, peso, idade e nível.",
  },
  {
    key: "medical",
    title: "Anamnese",
    subtitle: "Condições médicas (visual).",
  },
  {
    key: "assistant",
    title: "Sua Assistente",
    subtitle: "Defina o apelido da IA.",
  },
  {
    key: "verify",
    title: "Verificação",
    subtitle: "Aguardando email verificado.",
  },
];

const accountSchema = z.object({
  nome: z.string().min(2, "Informe seu nome."),
  email: z.string().email("Email inválido."),
  senha: z.string().min(8, "Mínimo 8 caracteres."),
});

const biometricsSchema = z.object({
  alturaCm: z.number().min(120).max(230),
  pesoKg: z.number().min(35).max(250),
  idade: z.number().min(12).max(95),
  genero: z.enum(["masculino", "feminino", "outro"] satisfies [Gender, Gender, Gender]),
  nivelAtividade: z.enum(
    ["sedentario", "leve", "moderado", "intenso", "atleta"] satisfies [
      ActivityLevel,
      ActivityLevel,
      ActivityLevel,
      ActivityLevel,
      ActivityLevel,
    ],
  ),
});

const assistantSchema = z.object({
  nomeAssistente: z.string().min(2, "Escolha um apelido curto."),
});

function clampNumber(input: string, fallback: number) {
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}

export function OnboardingFlow() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = React.useState(0);
  const [draft, setDraft] = React.useState<OnboardingDraft>(defaultDraft);
  const [showOffer, setShowOffer] = React.useState(false);
  const [signupLoading, setSignupLoading] = React.useState(false);
  const [signupError, setSignupError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = loadDraft();
    if (stored) setDraft(stored);
  }, []);

  React.useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const activeKey = steps[stepIndex]?.key as StepKey;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const canGoBack = stepIndex > 0;
  const canGoNext = stepIndex < steps.length - 1;

  const validateStep = (): string | null => {
    if (activeKey === "account") {
      const res = accountSchema.safeParse(draft);
      return res.success ? null : res.error.issues[0]?.message ?? "Dados inválidos.";
    }
    if (activeKey === "biometrics") {
      const res = biometricsSchema.safeParse(draft);
      return res.success ? null : "Verifique seus números.";
    }
    if (activeKey === "assistant") {
      const res = assistantSchema.safeParse(draft);
      return res.success ? null : res.error.issues[0]?.message ?? "Nome inválido.";
    }
    return null;
  };

  const [error, setError] = React.useState<string | null>(null);

  const next = () => {
    const e = validateStep();
    setError(e);
    if (e) return;
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  };

  const back = () => {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
      <div className="space-y-4">
        <div className="rounded-3xl border border-cyber-glass-border bg-cyber-glass/25 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">
                Setup do Atleta
              </div>
              <div className="text-xs text-muted-foreground">
                Progresso do onboarding
              </div>
            </div>
            <div className="text-xs font-semibold text-neon-cyan">
              {Math.round(progress)}%
            </div>
          </div>
          <div className="mt-3">
            <Progress value={progress} className="h-2 bg-white/10" />
          </div>
        </div>

        <Stepper steps={steps} activeIndex={stepIndex} />
      </div>

      <div className="space-y-4">
        <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-24 opacity-50 blur-3xl [background:radial-gradient(60%_55%_at_15%_20%,color-mix(in_oklab,var(--neon-cyan)_18%,transparent),transparent_60%),radial-gradient(60%_55%_at_80%_30%,color-mix(in_oklab,var(--neon-violet)_16%,transparent),transparent_65%)]"
          />

          <div className="relative">
            <div className="text-xs font-medium tracking-wide text-muted-foreground">
              ETAPA {stepIndex + 1} / {steps.length}
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {steps[stepIndex]?.title}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {steps[stepIndex]?.subtitle}
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeKey === "account" ? (
                    <AccountStep draft={draft} setDraft={setDraft} />
                  ) : activeKey === "biometrics" ? (
                    <BiometricsStep draft={draft} setDraft={setDraft} />
                  ) : activeKey === "medical" ? (
                    <MedicalStep draft={draft} setDraft={setDraft} />
                  ) : activeKey === "assistant" ? (
                    <AssistantStep draft={draft} setDraft={setDraft} />
                  ) : (
                    <VerifyStep
                      draft={draft}
                      signupLoading={signupLoading}
                      signupError={signupError}
                      onCreateAccount={async () => {
                        setSignupError(null);
                        setSignupLoading(true);
                        try {
                          const supabase = createClient();
                          const origin = window.location.origin;
                          const { error } = await supabase.auth.signUp({
                            email: draft.email,
                            password: draft.senha,
                            options: {
                              emailRedirectTo: `${origin}/auth/callback`,
                              data: {
                                nome: draft.nome,
                                nome_assistente: draft.nomeAssistente,
                              },
                            },
                          });
                          if (error) throw error;
                          router.push("/verify");
                        } catch (e: unknown) {
                          setSignupError(getErrorMessage(e) || "Erro ao criar conta.");
                        } finally {
                          setSignupLoading(false);
                        }
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-neon-red/30 bg-black/30 px-4 py-3 text-sm text-neon-red">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={back}
                disabled={!canGoBack}
                className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40 disabled:opacity-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              {activeKey !== "verify" ? (
                <Button
                  type="button"
                  onClick={next}
                  disabled={!canGoNext}
                  className="bg-neon-cyan text-black hover:bg-neon-cyan/90"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => router.push("/verify")}
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                >
                  Ir para verificação
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="rounded-3xl border border-cyber-glass-border bg-black/20 p-4 text-xs text-muted-foreground">
          Backend ainda não está ligado. No próximo passo, conectamos esse fluxo
          ao Supabase Auth e salvamos no banco.
        </div>
      </div>

      <OfferModal
        open={showOffer}
        userName={draft.nome}
        onAccept={() => {
          setPlan("plus");
          setShowOffer(false);
          router.push("/dashboard");
        }}
        onDecline={() => {
          setPlan("free");
          setShowOffer(false);
          router.push("/dashboard");
        }}
      />
    </div>
  );
}

function FieldShell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-end justify-between gap-4">
        <Label className="text-sm">{label}</Label>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function AccountStep({
  draft,
  setDraft,
}: {
  draft: OnboardingDraft;
  setDraft: React.Dispatch<React.SetStateAction<OnboardingDraft>>;
}) {
  return (
    <div className="grid gap-4">
      <FieldShell label="Nome" hint="Como você quer ser chamado?">
        <Input
          value={draft.nome}
          onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
          placeholder="Ex: Lucas"
          className="border-cyber-glass-border bg-black/25"
        />
      </FieldShell>

      <FieldShell label="Email" hint="Usaremos para login e verificação.">
        <Input
          value={draft.email}
          onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          placeholder="voce@exemplo.com"
          className="border-cyber-glass-border bg-black/25"
        />
      </FieldShell>

      <FieldShell label="Senha" hint="Mínimo 8 caracteres.">
        <Input
          type="password"
          value={draft.senha}
          onChange={(e) => setDraft((d) => ({ ...d, senha: e.target.value }))}
          placeholder="••••••••"
          className="border-cyber-glass-border bg-black/25"
        />
      </FieldShell>
    </div>
  );
}

function BiometricsStep({
  draft,
  setDraft,
}: {
  draft: OnboardingDraft;
  setDraft: React.Dispatch<React.SetStateAction<OnboardingDraft>>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FieldShell label="Altura (cm)">
        <Input
          inputMode="numeric"
          value={draft.alturaCm}
          onChange={(e) =>
            setDraft((d) => ({ ...d, alturaCm: clampNumber(e.target.value, d.alturaCm) }))
          }
          className="border-cyber-glass-border bg-black/25"
        />
      </FieldShell>

      <FieldShell label="Peso (kg)">
        <Input
          inputMode="numeric"
          value={draft.pesoKg}
          onChange={(e) =>
            setDraft((d) => ({ ...d, pesoKg: clampNumber(e.target.value, d.pesoKg) }))
          }
          className="border-cyber-glass-border bg-black/25"
        />
      </FieldShell>

      <FieldShell label="Idade">
        <Input
          inputMode="numeric"
          value={draft.idade}
          onChange={(e) =>
            setDraft((d) => ({ ...d, idade: clampNumber(e.target.value, d.idade) }))
          }
          className="border-cyber-glass-border bg-black/25"
        />
      </FieldShell>

      <FieldShell label="Gênero">
        <Select
          value={draft.genero}
          onValueChange={(v) => setDraft((d) => ({ ...d, genero: v as Gender }))}
        >
          <SelectTrigger className="border-cyber-glass-border bg-black/25">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="masculino">Masculino</SelectItem>
            <SelectItem value="feminino">Feminino</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </FieldShell>

      <FieldShell label="Nível de atividade" hint="Para estimar metas e gasto.">
        <Select
          value={draft.nivelAtividade}
          onValueChange={(v) =>
            setDraft((d) => ({ ...d, nivelAtividade: v as ActivityLevel }))
          }
        >
          <SelectTrigger className="border-cyber-glass-border bg-black/25">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sedentario">Sedentário</SelectItem>
            <SelectItem value="leve">Leve (1–2x/sem)</SelectItem>
            <SelectItem value="moderado">Moderado (3–4x/sem)</SelectItem>
            <SelectItem value="intenso">Intenso (5–6x/sem)</SelectItem>
            <SelectItem value="atleta">Atleta (alto volume)</SelectItem>
          </SelectContent>
        </Select>
      </FieldShell>

      <div className="sm:col-span-2 rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-sm text-muted-foreground">
        Isso alimenta recomendações futuras (cutting/bulking) e a consistência do
        dashboard.
      </div>
    </div>
  );
}

function MedicalStep({
  draft,
  setDraft,
}: {
  draft: OnboardingDraft;
  setDraft: React.Dispatch<React.SetStateAction<OnboardingDraft>>;
}) {
  const toggle = (key: MedicalConditionKey, val: boolean) => {
    setDraft((d) => ({
      ...d,
      condicoesMedicas: { ...d.condicoesMedicas, [key]: val },
    }));
  };

  return (
    <div className="grid gap-4">
      <div className="text-sm text-muted-foreground">
        Selecione o que se aplica. Isso ajusta alertas e recomendações.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {medicalConditionsCatalog.map((c) => {
          const checked = !!draft.condicoesMedicas[c.key];
          const accent =
            c.accent === "cyan"
              ? "shadow-[0_0_0_1px_rgba(0,245,255,0.10)]"
              : c.accent === "green"
                ? "shadow-[0_0_0_1px_rgba(57,255,136,0.10)]"
                : c.accent === "red"
                  ? "shadow-[0_0_0_1px_rgba(255,45,85,0.10)]"
                  : "shadow-[0_0_0_1px_rgba(184,77,255,0.10)]";
          const border =
            c.accent === "cyan"
              ? "border-neon-cyan/30"
              : c.accent === "green"
                ? "border-neon-green/30"
                : c.accent === "red"
                  ? "border-neon-red/30"
                  : "border-neon-violet/30";

          return (
            <button
              key={c.key}
              type="button"
              onClick={() => toggle(c.key, !checked)}
              className={cn(
                "group rounded-3xl border bg-black/20 p-4 text-left transition-colors",
                "border-cyber-glass-border hover:bg-cyber-glass/35",
                checked && cn(border, accent),
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold tracking-tight">
                    {c.title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {c.desc}
                  </div>
                </div>
                <div className="pt-1">
                  <Checkbox checked={checked} aria-label={c.title} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-xs text-muted-foreground">
        No backend, isso fica guardado nas suas informações de saúde.
      </div>
    </div>
  );
}

function AssistantStep({
  draft,
  setDraft,
}: {
  draft: OnboardingDraft;
  setDraft: React.Dispatch<React.SetStateAction<OnboardingDraft>>;
}) {
  const presets = ["Jarvis", "Athena", "Nova", "Pulse", "Valkyrie"];

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-cyber-glass-border bg-black/20 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border border-cyber-glass-border bg-black/30">
            <Sparkles className="h-4 w-4 text-neon-violet" />
          </div>
          <div className="text-sm text-muted-foreground">
            Sua assistente vai usar seu nome e o apelido abaixo para dar feedback
            com personalidade.
          </div>
        </div>
      </div>

      <FieldShell label="Apelido da Assistente">
        <Input
          value={draft.nomeAssistente}
          onChange={(e) =>
            setDraft((d) => ({ ...d, nomeAssistente: e.target.value }))
          }
          placeholder="Ex: Jarvis"
          className="border-cyber-glass-border bg-black/25"
        />
      </FieldShell>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setDraft((d) => ({ ...d, nomeAssistente: p }))}
            className={cn(
              "rounded-full border border-cyber-glass-border bg-black/20 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-cyber-glass/35 hover:text-foreground",
              draft.nomeAssistente === p &&
                "border-neon-violet/35 text-neon-violet",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-sm">
        <div className="text-xs font-medium tracking-wide text-muted-foreground">
          Preview
        </div>
        <div className="mt-2 flex items-start gap-3">
          <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl border border-cyber-glass-border bg-black/25">
            <CheckCircle2 className="h-4 w-4 text-neon-green" />
          </div>
          <div className="text-sm leading-relaxed text-muted-foreground">
            “Mandou bem demais,{" "}
            <span className="text-foreground">{draft.nome || "Atleta"}</span>!”
            Aqui é{" "}
            <span className="text-neon-violet">
              {draft.nomeAssistente || "Sua Assistente"}
            </span>
            . Bora manter a consistência hoje.
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifyStep({
  draft,
  signupLoading,
  signupError,
  onCreateAccount,
}: {
  draft: OnboardingDraft;
  signupLoading: boolean;
  signupError: string | null;
  onCreateAccount: () => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-cyber-glass-border bg-black/20 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl border border-cyber-glass-border bg-black/30">
            <MailCheck className="h-5 w-5 text-neon-cyan" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">
              Verifique seu email
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Enviamos um link para{" "}
              <span className="text-foreground">{draft.email || "seu email"}</span>
              . Assim que confirmar, você continua.
            </div>
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={onCreateAccount}
        className="h-12 bg-neon-green text-black hover:bg-neon-green/90"
        disabled={signupLoading}
      >
        {signupLoading ? "Enviando..." : "Criar conta + Enviar verificação"}
        <Sparkles className="ml-2 h-4 w-4" />
      </Button>

      {signupError ? (
        <div className="rounded-2xl border border-neon-red/30 bg-black/30 px-4 py-3 text-sm text-neon-red">
          {signupError}
        </div>
      ) : (
        <div className="rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-xs text-muted-foreground">
          Dica: se você já tem conta, vá para <span className="text-foreground">/auth</span>{" "}
          e faça login.
        </div>
      )}
    </div>
  );
}

