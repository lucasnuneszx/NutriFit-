"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  Camera,
  Flame,
  Dumbbell,
  LogOut,
  ScanLine,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { setPlan, type PlanType } from "@/components/app/local-profile";
import { CyberBackground } from "@/components/landing/cyber-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { UpgradeModal } from "./upgrade-modal";

type Message = { role: "assistant" | "user"; text: string };
type MeResponse = {
  ok: boolean;
  profile: null | {
    nome: string | null;
    nome_assistente: string | null;
    email: string | null;
    tipo_plano: "free" | "plus" | null;
  };
};

type VisionOk = {
  ok: true;
  plan: "free" | "plus";
  usage: { weekId: string; used: number; limit: number | null };
  storage: { signedUrl: string | null };
  analysis: unknown;
};

type VisionLimit = {
  ok: false;
  code: "LIMIT_REACHED";
  usage: { weekId: string; used: number; limit: number };
};

export function DashboardShell() {
  const [profile, setProfileState] = React.useState(() => ({
    nome: "Atleta",
    nomeAssistente: "Athena",
    email: "",
  }));
  const [plan, setPlanState] = React.useState<PlanType>("free");
  const [usage, setUsageState] = React.useState(() => ({
    weekId: "—",
    used: 0,
    limit: 3 as number | null,
  }));
  const [streak, setStreakState] = React.useState(() => ({
    count: 0,
    last7: [] as Array<{ date: string; did: boolean }>,
    hasWorkoutToday: false,
  }));
  const [todayWorkout, setTodayWorkout] = React.useState(() => ({
    hasWorkout: false,
    exercises: 0,
    sets: 0,
    volumeKg: 0,
  }));
  const [week, setWeek] = React.useState(() => ({
    start: "",
    today: "",
    days: [] as Array<{
      date: string;
      workouts: number;
      sets: number;
      volume_kg: number;
      scans: number;
      calories: number;
    }>,
  }));
  const [month, setMonth] = React.useState(() => ({
    start: "",
    today: "",
    days: [] as Array<{
      date: string;
      workouts: number;
      sets: number;
      volume_kg: number;
      scans: number;
      calories: number;
    }>,
  }));
  const [prs, setPrs] = React.useState(() => ({
    items: [] as Array<{
      key: string;
      exercise: string;
      variation: string;
      best_weight_kg: number;
      best_reps: number;
      best_e1rm: number;
    }>,
  }));

  const [showUpgrade, setShowUpgrade] = React.useState(false);

  const [fileUrl, setFileUrl] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [resultJson, setResultJson] = React.useState<string | null>(null);

  const [chat, setChat] = React.useState<Message[]>([
    {
      role: "assistant",
      text: "Pronto. Me mande uma refeição e eu devolvo macros + feedback.",
    },
  ]);
  const [composer, setComposer] = React.useState("");
  const [sendingMessage, setSendingMessage] = React.useState(false);
  const [scanHistory, setScanHistory] = React.useState<Array<{
    id: number;
    imagem_url: string | null;
    dados_alimento: unknown;
    criado_em: string;
  }>>([]);

  const refreshStreak = React.useCallback(async () => {
    try {
      const res = await fetch("/api/activity/streak");
      if (res.status === 401) return;
      const json = (await res.json()) as unknown;
      const data = json as Partial<{
        ok: boolean;
        streak: number;
        last7: Array<{ date: string; did: boolean }>;
        hasWorkoutToday: boolean;
      }>;
      if (!data.ok) return;
      setStreakState({
        count: data.streak ?? 0,
        last7: Array.isArray(data.last7) ? data.last7 : [],
        hasWorkoutToday: !!data.hasWorkoutToday,
      });
    } catch {
      // ignore
    }
  }, []);

  const mark = async () => {
    try {
      await fetch("/api/activity/workout", { method: "POST" });
    } finally {
      await refreshStreak();
    }
  };

  const refreshTodaySummary = React.useCallback(async () => {
    try {
      const res = await fetch("/api/activity/summary");
      if (res.status === 401) return;
      const json = (await res.json()) as unknown;
      const data = json as Partial<{
        ok: boolean;
        hasWorkout: boolean;
        stats: { exercises: number; sets: number; volume_kg: number };
      }>;
      if (!data.ok) return;
      setTodayWorkout({
        hasWorkout: !!data.hasWorkout,
        exercises: data.stats?.exercises ?? 0,
        sets: data.stats?.sets ?? 0,
        volumeKg: data.stats?.volume_kg ?? 0,
      });
    } catch {
      // ignore
    }
  }, []);

  const refreshWeek = React.useCallback(async () => {
    try {
      const res = await fetch("/api/activity/week");
      if (res.status === 401) return;
      const json = (await res.json()) as unknown;
      const data = json as Partial<{
        ok: boolean;
        start: string;
        today: string;
        days: Array<{
          date: string;
          workouts: number;
          sets: number;
          volume_kg: number;
          scans: number;
          calories: number;
        }>;
      }>;
      if (!data.ok) return;
      setWeek({
        start: data.start ?? "",
        today: data.today ?? "",
        days: Array.isArray(data.days) ? data.days : [],
      });
    } catch {
      // ignore
    }
  }, []);

  const refreshMonth = React.useCallback(async () => {
    try {
      const res = await fetch("/api/activity/month");
      if (res.status === 401) return;
      const json = (await res.json()) as unknown;
      const data = json as Partial<{
        ok: boolean;
        start: string;
        today: string;
        days: Array<{
          date: string;
          workouts: number;
          sets: number;
          volume_kg: number;
          scans: number;
          calories: number;
        }>;
      }>;
      if (!data.ok) return;
      setMonth({
        start: data.start ?? "",
        today: data.today ?? "",
        days: Array.isArray(data.days) ? data.days : [],
      });
    } catch {
      // ignore
    }
  }, []);

  const refreshPRs = React.useCallback(async () => {
    try {
      const res = await fetch("/api/workouts/prs");
      if (res.status === 401) return;
      const json = (await res.json()) as unknown;
      const data = json as Partial<{
        ok: boolean;
        prs: Array<{
          key: string;
          exercise: string;
          variation: string;
          best_weight_kg: number;
          best_reps: number;
          best_e1rm: number;
        }>;
      }>;
      if (!data.ok) return;
      setPrs({ items: Array.isArray(data.prs) ? data.prs : [] });
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/profile/me");
        if (res.status === 401) {
          window.location.href = "/auth?next=/dashboard";
          return;
        }
        const json = (await res.json()) as unknown;
        const data = json as Partial<MeResponse>;
        const p = data?.profile ?? null;
        if (p && typeof p === "object") {
          setProfileState({
            nome: p.nome || "Atleta",
            nomeAssistente: p.nome_assistente || "Athena",
            email: p.email || "",
          });
          setPlanState(p.tipo_plano === "plus" ? "plus" : "free");
        }
      } catch {
        // fallback silencioso
      }
    };
    void load();
    void refreshStreak();
    void refreshTodaySummary();
    void refreshWeek();
    void refreshMonth();
    void refreshPRs();
  }, [refreshStreak, refreshTodaySummary, refreshWeek, refreshMonth, refreshPRs]);

  const scansLeft =
    plan === "free" ? Math.max(0, (usage.limit ?? 3) - usage.used) : Infinity;

  const onChoosePlan = (p: PlanType) => {
    void (async () => {
      setPlan(p);
      setPlanState(p);
      setShowUpgrade(false);
      try {
        await fetch("/api/profile/plan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ plan: p }),
        });
      } catch {
        // ignore
      }
    })();
  };

  const startScan = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    setIsScanning(true);
    setResultJson(null);

    try {
      const fd = new FormData();
      fd.append("image", file);

      const res = await fetch("/api/vision", { method: "POST", body: fd });
      const json = (await res.json()) as unknown;

      if (res.status === 401) {
        window.location.href = "/auth?next=/dashboard";
        return;
      }

      if (res.status === 429) {
        const limit = json as Partial<VisionLimit>;
        if (limit?.code === "LIMIT_REACHED" && limit.usage) {
          setUsageState({
            weekId: limit.usage.weekId ?? "—",
            used: limit.usage.used ?? 0,
            limit: limit.usage.limit ?? 3,
          });
          setShowUpgrade(true);
          return;
        }
      }

      const ok = json as Partial<VisionOk>;
      if (!res.ok || ok?.ok !== true) {
        setResultJson(JSON.stringify(json, null, 2));
        return;
      }

      setPlanState(ok.plan === "plus" ? "plus" : "free");
      setUsageState({
        weekId: ok.usage?.weekId ?? "—",
        used: ok.usage?.used ?? 0,
        limit: ok.usage?.limit ?? null,
      });

      if (ok.storage?.signedUrl) setFileUrl(ok.storage.signedUrl);
      setResultJson(JSON.stringify(ok.analysis, null, 2));

      const analysis = ok.analysis as {
        macros?: { calories?: number; protein_g?: number };
      };
      const calories = Number(analysis?.macros?.calories ?? 0);
      const protein = Number(analysis?.macros?.protein_g ?? 0);
      const healthy = calories < 650 && protein >= 25;
      const feedback = healthy
        ? `Mandou bem demais, ${profile.nome}! Combustível puro.`
        : `Equilíbrio é tudo, ${profile.nome}. Aproveite, mas hidrate-se!`;

      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: `${profile.nomeAssistente}: ${feedback} Quer que eu ajuste isso pro seu objetivo?`,
        },
      ]);
      await loadScanHistory();
      await refreshTodaySummary();
      await refreshWeek();
      await refreshMonth();
      return;
    } finally {
      setIsScanning(false);
    }

    // unreachable
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    void startScan(f);
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    void startScan(f);
    // Reset input para permitir capturar novamente
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const sendMessage = async () => {
    const text = composer.trim();
    if (!text || sendingMessage) return;
    const userMsg = { role: "user" as const, text };
    setChat((c) => [...c, userMsg]);
    setComposer("");
    setSendingMessage(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, history: chat }),
      });
      if (res.status === 401) {
        window.location.href = "/auth?next=/dashboard";
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean; reply: string }>;
      if (!data.ok || !data.reply) {
        setChat((c) => [
          ...c,
          {
            role: "assistant",
            text: `${profile.nomeAssistente}: Desculpe, não consegui processar sua mensagem agora.`,
          },
        ]);
        return;
      }
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: `${profile.nomeAssistente}: ${data.reply}`,
        },
      ]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: `${profile.nomeAssistente}: Erro: ${errorMsg}. Verifique a chave da OpenAI no .env.local`,
        },
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const loadScanHistory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/logs/history?limit=10");
      if (res.status === 401) return;
      const json = (await res.json()) as unknown;
      const data = json as Partial<{
        ok: boolean;
        logs: Array<{
          id: number;
          imagem_url: string | null;
          dados_alimento: unknown;
          criado_em: string;
        }>;
      }>;
      if (!data.ok) return;
      setScanHistory(Array.isArray(data.logs) ? data.logs : []);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    void loadScanHistory();
  }, [loadScanHistory]);

  return (
    <div className="relative min-h-screen">
      <CyberBackground />

      <main className="mx-auto w-full max-w-7xl px-3 pb-8 pt-4 sm:px-4 sm:pb-12 sm:pt-6 lg:px-6 lg:pt-8">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-12">
          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-4">
            <Glow accent="green" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  STREAK
                </div>
                <div className="mt-1 flex items-end gap-2">
                  <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-neon-green">
                    {streak.count}
                  </div>
                  <div className="pb-1 text-sm text-muted-foreground">
                    dias consecutivos
                  </div>
                </div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyber-glass-border bg-black/20">
                <Flame className="h-5 w-5 text-neon-green" />
              </div>
            </div>

            <Separator className="my-4 bg-white/10" />

            <div className="relative grid gap-3">
              <div className="text-sm text-muted-foreground">
                Marque o dia como concluído e mantenha a ofensiva viva.
              </div>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyber-glass-border bg-black/20 px-4 py-3">
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  ÚLTIMOS 7 DIAS
                </div>
                <div className="flex items-center gap-1">
                  {streak.last7.map((d) => (
                    <div
                      key={d.date}
                      title={d.date}
                      className={cn(
                        "h-3 w-3 rounded-[4px] border",
                        d.did
                          ? "border-neon-green/40 bg-neon-green/30"
                          : "border-cyber-glass-border bg-black/30",
                      )}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={mark}
                className="bg-neon-green text-black hover:bg-neon-green/90"
              >
                {streak.hasWorkoutToday ? "Treino registrado hoje" : "Marcar treino hoje"}
              </Button>
              <div className="text-xs text-muted-foreground">
                Streak considera: treino do dia <span className="text-foreground">ou</span>{" "}
                scan de refeição.
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-8">
            <Glow accent="cyan" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyber-glass-border bg-black/20">
                    <ScanLine className="h-5 w-5 text-neon-cyan" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight">
                      Vision AI • Scan de refeição
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {plan === "free"
                        ? `Plano Free: ${usage.used}/${usage.limit ?? 3} scans nesta semana (${usage.weekId}).`
                        : `Plano NutriPlus: ilimitado (${usage.weekId}).`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {plan === "free" ? (
                  <Badge className="border-cyber-glass-border bg-black/30 text-muted-foreground">
                    Restam{" "}
                    <span className="ml-1 font-semibold text-neon-cyan">
                      {scansLeft}
                    </span>
                  </Badge>
                ) : (
                  <Badge className="border-cyber-glass-border bg-black/30 text-neon-green">
                    ilimitado
                  </Badge>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onUpload}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onCameraCapture}
                />
                <div className="flex gap-3 sm:hidden">
                  <button
                    type="button"
                    onClick={handleCameraCapture}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Abrir câmera"
                  >
                    <Camera className="h-6 w-6 text-neon-cyan" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectImage}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Abrir biblioteca"
                  >
                    <Upload className="h-6 w-6 text-neon-cyan" />
                  </button>
                </div>
                <Button
                  type="button"
                  onClick={handleSelectImage}
                  className="hidden bg-neon-cyan text-black hover:bg-neon-cyan/90 sm:flex"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar da biblioteca
                </Button>
              </div>
            </div>

            <div className="relative mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div
                className="relative overflow-hidden rounded-3xl border border-cyber-glass-border bg-black/25 cursor-pointer transition-all hover:border-neon-cyan/50 active:scale-[0.98]"
                onClick={handleSelectImage}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectImage();
                  }
                }}
                aria-label="Clique para selecionar imagem da biblioteca"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-xs font-medium tracking-wide text-muted-foreground">
                    PREVIEW
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Camera className="h-4 w-4 text-neon-cyan" />
                    <span className="hidden sm:inline">Clique para selecionar</span>
                    <span className="sm:hidden">Toque para selecionar</span>
                  </div>
                </div>
                <Separator className="bg-white/10" />

                <div className="relative aspect-[16/10]">
                  {fileUrl ? (
                    <>
                      <Image
                        src={fileUrl}
                        alt="Refeição"
                        fill
                        className="object-cover opacity-90"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      {isScanning ? (
                        <motion.div
                          aria-hidden="true"
                          animate={{ y: ["-10%", "110%", "-10%"] }}
                          transition={{
                            duration: 2.6,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="absolute left-0 right-0 h-14 opacity-80 [background:linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--neon-cyan)_40%,transparent),transparent)]"
                          style={{
                            boxShadow:
                              "0 0 0 1px rgb(255 255 255 / 0.08), 0 0 30px color-mix(in oklab, var(--neon-cyan) 35%, transparent)",
                          }}
                        />
                      ) : null}
                    </>
                  ) : (
                    <div className="grid h-full place-items-center p-8 text-center">
                      <div>
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyber-glass-border bg-black/25">
                          <Camera className="h-6 w-6 text-neon-cyan" />
                        </div>
                        <div className="mt-3 text-sm font-semibold tracking-tight">
                          Clique para selecionar foto
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Da biblioteca do seu dispositivo
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground/70">
                          Eu retorno macros e um feedback estilo atleta.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-cyber-glass-border bg-black/25">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-xs font-medium tracking-wide text-muted-foreground">
                    RESULTADO DA REFEIÇÃO
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BrainCircuit className="h-4 w-4 text-neon-cyan" />
                    GPT-4o
                  </div>
                </div>
                <Separator className="bg-white/10" />

                <ScrollArea className="h-[260px]">
                  <div className="p-4">
                    {resultJson ? (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-cyber-glass-border bg-black/30 p-3">
                          <div className="text-xs font-medium text-muted-foreground mb-3">
                            Análise Nutricional
                          </div>
                          <pre className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                            {resultJson}
                          </pre>
                        </div>
                        <div className="rounded-2xl border border-cyber-glass-border/50 bg-black/20 p-3">
                          <div className="text-sm text-muted-foreground italic">
                            "Tem alguma dúvida sobre essa refeição? Posso ajudar com sugestões ou ajustes! 😊"
                          </div>
                        </div>
                      </div>
                    ) : isScanning ? (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Analisando sua refeição...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Envie uma foto para ver a análise
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-7">
            <Glow accent="violet" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  ASSISTENTE IA
                </div>
                <div className="mt-1 text-sm font-semibold tracking-tight">
                  {profile.nomeAssistente} • Coach Mode
                </div>
              </div>
              <Badge className="border-cyber-glass-border bg-black/30 text-neon-violet">
                personalidade
              </Badge>
            </div>

            <Separator className="my-4 bg-white/10" />

            <ScrollArea className="h-[260px] pr-2">
              <div className="grid gap-3">
                {chat.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm leading-relaxed",
                      m.role === "assistant"
                        ? "border-cyber-glass-border bg-black/25 text-muted-foreground"
                        : "border-neon-cyan/25 bg-black/30 text-foreground",
                    )}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 flex gap-2">
              <Textarea
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder="Ex: Hoje quero cutting, 2.000 kcal..."
                className="min-h-[44px] resize-none border-cyber-glass-border bg-black/25"
              />
              <Button
                onClick={sendMessage}
                disabled={sendingMessage || !composer.trim()}
                className="h-[44px] bg-neon-violet text-black hover:bg-neon-violet/90 disabled:opacity-50"
              >
                {sendingMessage ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-7">
            <Glow accent="cyan" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  TREINO DE HOJE
                </div>
                <div className="mt-1 text-sm font-semibold tracking-tight">
                  Resumo (Supabase)
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Exercícios, sets e volume total.
                </div>
              </div>
              <Badge className="border-cyber-glass-border bg-black/30 text-neon-cyan">
                live
              </Badge>
            </div>

            <Separator className="my-4 bg-white/10" />

            <div className="relative grid gap-3 sm:grid-cols-3">
              <StatBox label="Exercícios" value={todayWorkout.exercises} accent="cyan" />
              <StatBox label="Sets" value={todayWorkout.sets} accent="green" />
              <StatBox label="Volume (kg)" value={todayWorkout.volumeKg} accent="violet" />
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                {todayWorkout.hasWorkout
                  ? "Continue registrando sets no Treino do Dia."
                  : "Ainda sem treino do dia. Adicione um item em /treinos."}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                  onClick={refreshTodaySummary}
                >
                  Atualizar
                </Button>
                <Button className="bg-neon-cyan text-black hover:bg-neon-cyan/90" asChild>
                  <Link href="/treinos">Abrir treinos</Link>
                </Button>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-5">
            <Glow accent="violet" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  SEMANA
                </div>
                <div className="mt-1 text-sm font-semibold tracking-tight">
                  Histórico (7 dias)
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Treino + scans + volume.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                  onClick={refreshWeek}
                >
                  Atualizar
                </Button>
              </div>
            </div>

            <Separator className="my-4 bg-white/10" />

            <WeekMiniChart days={week.days} />

            <Separator className="my-4 bg-white/10" />

            <div className="grid grid-cols-3 gap-2">
              <StatBox
                label="Scans"
                value={week.days.reduce((a, d) => a + (d.scans ?? 0), 0)}
                accent="cyan"
              />
              <StatBox
                label="Sets"
                value={week.days.reduce((a, d) => a + (d.sets ?? 0), 0)}
                accent="green"
              />
              <StatBox
                label="Kcal"
                value={week.days.reduce((a, d) => a + (d.calories ?? 0), 0)}
                accent="violet"
              />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-7">
            <Glow accent="violet" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  MÊS
                </div>
                <div className="mt-1 text-sm font-semibold tracking-tight">
                  Histórico (30 dias)
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Heatmap compacto de atividade.
                </div>
              </div>
              <Button
                variant="secondary"
                className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                onClick={refreshMonth}
              >
                Atualizar
              </Button>
            </div>

            <Separator className="my-4 bg-white/10" />

            <MonthHeatmap days={month.days} />
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-5">
            <Glow accent="cyan" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  PRs
                </div>
                <div className="mt-1 text-sm font-semibold tracking-tight">
                  Recordes (e1RM estimado)
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Top 8 exercícios/variações.
                </div>
              </div>
              <Button
                variant="secondary"
                className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                onClick={refreshPRs}
              >
                Atualizar
              </Button>
            </div>

            <Separator className="my-4 bg-white/10" />

            <div className="grid gap-2">
              {prs.items.length === 0 ? (
                <div className="rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-sm text-muted-foreground">
                  Sem PRs ainda. Registre sets no Treino do Dia.
                </div>
              ) : (
                prs.items.map((p) => (
                  <div
                    key={p.key}
                    className="rounded-2xl border border-cyber-glass-border bg-black/20 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold tracking-tight">
                          {p.exercise}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.variation}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-neon-cyan">
                          e1RM {p.best_e1rm}kg
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.best_weight_kg}kg × {p.best_reps}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-7">
            <Glow accent="green" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  HISTÓRICO DE SCANS
                </div>
                <div className="mt-1 text-sm font-semibold tracking-tight">
                  Últimas refeições analisadas
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Visualize seus logs recentes.
                </div>
              </div>
              <Button
                variant="secondary"
                className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                onClick={loadScanHistory}
              >
                Atualizar
              </Button>
            </div>

            <Separator className="my-4 bg-white/10" />

            <ScrollArea className="h-[240px] pr-2">
              <div className="grid gap-2">
                {scanHistory.length === 0 ? (
                  <div className="rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-sm text-muted-foreground">
                    Sem scans ainda. Envie uma foto de comida acima.
                  </div>
                ) : (
                  scanHistory.map((log) => {
                    const dados = log.dados_alimento as unknown;
                    const dish = extractDish(dados);
                    const macros = extractMacros(dados);
                    const calories = macros && typeof macros.calories === "number" ? macros.calories : 0;
                    const date = new Date(log.criado_em).toLocaleDateString("pt-BR");

                    return (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-cyber-glass-border bg-black/20 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold tracking-tight">{dish}</div>
                            <div className="text-xs text-muted-foreground">
                              {calories > 0 ? `${calories} kcal` : "—"} • {date}
                            </div>
                          </div>
                          <Badge className="border-cyber-glass-border bg-black/30 text-neon-cyan">
                            log
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-5">
            <Glow accent="red" />
            <div className="relative">
              <div className="text-xs font-medium tracking-wide text-muted-foreground">
                BLOQUEIOS (Free)
              </div>
              <div className="mt-1 text-sm font-semibold tracking-tight">
                Simulação de limite semanal
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Quando o Free passa de <span className="text-foreground">3 scans</span>{" "}
                na semana, acionamos o modal de upgrade automaticamente.
              </div>
            </div>

            <Separator className="my-4 bg-white/10" />

            <div className="relative grid gap-3">
              <div className="rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-sm text-muted-foreground">
                Status atual:{" "}
                <span className="text-foreground">{usage.used}</span>{" "}
                scans • Semana{" "}
                <span className="text-foreground">{usage.weekId}</span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                  onClick={() => {
                    setPlan("free");
                    setPlanState("free");
                  }}
                >
                  Modo Free
                </Button>
                <Button
                  className="bg-neon-green text-black hover:bg-neon-green/90"
                  onClick={() => onChoosePlan("plus")}
                >
                  Ativar NutriPlus (mock)
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <UpgradeModal
        open={showUpgrade}
        userName={profile.nome}
        onChoose={onChoosePlan}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  );
}

function Glow({ accent }: { accent: "cyan" | "green" | "red" | "violet" }) {
  const bg =
    accent === "cyan"
      ? "[background:radial-gradient(60%_60%_at_20%_20%,color-mix(in_oklab,var(--neon-cyan)_18%,transparent),transparent_70%)]"
      : accent === "green"
        ? "[background:radial-gradient(60%_60%_at_20%_20%,color-mix(in_oklab,var(--neon-green)_14%,transparent),transparent_72%)]"
        : accent === "red"
          ? "[background:radial-gradient(60%_60%_at_20%_20%,color-mix(in_oklab,var(--neon-red)_12%,transparent),transparent_72%)]"
          : "[background:radial-gradient(60%_60%_at_20%_20%,color-mix(in_oklab,var(--neon-violet)_14%,transparent),transparent_72%)]";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -inset-20 opacity-55 blur-3xl",
        bg,
      )}
    />
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "cyan" | "green" | "violet";
}) {
  const cls =
    accent === "cyan"
      ? "text-neon-cyan"
      : accent === "green"
        ? "text-neon-green"
        : "text-neon-violet";
  return (
    <div className="rounded-2xl border border-cyber-glass-border bg-black/25 p-4">
      <div className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tracking-tight", cls)}>
        {value}
      </div>
    </div>
  );
}

function WeekMiniChart({
  days,
}: {
  days: Array<{
    date: string;
    workouts: number;
    sets: number;
    volume_kg: number;
    scans: number;
    calories: number;
  }>;
}) {
  const maxVolume = Math.max(1, ...days.map((d) => Number(d.volume_kg ?? 0)));

  return (
    <div className="grid gap-3">
      <div className="flex items-end justify-between gap-2">
        {days.map((d) => {
          const h = Math.max(6, Math.round((Number(d.volume_kg ?? 0) / maxVolume) * 56));
          const hasAny = (d.workouts ?? 0) > 0 || (d.scans ?? 0) > 0;
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
              <div
                title={`${d.date} • volume ${d.volume_kg}kg • sets ${d.sets} • scans ${d.scans}`}
                className={cn(
                  "relative w-full rounded-xl border bg-black/25",
                  hasAny ? "border-cyber-glass-border" : "border-white/5 opacity-70",
                )}
                style={{ height: 64 }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-[10px] bg-neon-violet/25"
                  style={{ height: h }}
                />
                <div className="absolute left-1 right-1 top-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className={d.workouts ? "text-neon-green" : ""}>W</span>
                  <span className={d.scans ? "text-neon-cyan" : ""}>S</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {d.date.slice(8, 10)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        <span className="text-neon-green">W</span> treino •{" "}
        <span className="text-neon-cyan">S</span> scan • barra = volume (kg)
      </div>
    </div>
  );
}

function MonthHeatmap({
  days,
}: {
  days: Array<{
    date: string;
    workouts: number;
    sets: number;
    volume_kg: number;
    scans: number;
    calories: number;
  }>;
}) {
  // 30 dias = 6 colunas x 5 linhas (da esquerda para a direita)
  const cells = days.slice(-30);
  const max = Math.max(1, ...cells.map((d) => Number(d.volume_kg ?? 0)));

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-6 gap-2">
        {cells.map((d) => {
          const vol = Number(d.volume_kg ?? 0);
          const hasAny = (d.workouts ?? 0) > 0 || (d.scans ?? 0) > 0;
          const alpha = Math.min(0.55, 0.08 + (vol / max) * 0.55);
          return (
            <div
              key={d.date}
              title={`${d.date} • W ${d.workouts} • S ${d.scans} • sets ${d.sets} • vol ${d.volume_kg}kg`}
              className={cn(
                "h-8 rounded-xl border bg-black/25",
                hasAny ? "border-cyber-glass-border" : "border-white/5 opacity-70",
              )}
              style={{
                backgroundColor: hasAny ? `rgba(184,77,255,${alpha})` : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="text-xs text-muted-foreground">
        Quanto mais roxo, maior o volume (kg). Tooltip mostra W/S.
      </div>
    </div>
  );
}

function extractDish(dados: unknown): string {
  if (!dados || typeof dados !== "object") return "Refeição";
  const obj = dados as Record<string, unknown>;
  const dish = obj.dish;
  return typeof dish === "string" ? dish : "Refeição";
}

function extractMacros(dados: unknown): { calories?: number } | null {
  if (!dados || typeof dados !== "object") return null;
  const obj = dados as Record<string, unknown>;
  const macros = obj.macros;
  if (!macros || typeof macros !== "object") return null;
  return macros as { calories?: number };
}
