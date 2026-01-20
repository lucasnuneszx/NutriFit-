"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Dumbbell,
  Flame,
  Layers3,
  PlayCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { PlusGate } from "./plus-gate";
import { workoutCatalog, type MuscleGroup, type WorkoutExercise } from "./treinos-data";

type PlanItem = {
  id: number;
  group_id: string;
  exercise_id: string;
  variation_id: string;
  exercise_title: string | null;
  variation_title: string | null;
  created_at: string;
};

type TodaySet = {
  id: number;
  session_item_id: number;
  set_index: number;
  reps: number;
  weight_kg: number;
  rpe: number | null;
  created_at: string;
};

type TodayItem = {
  id: number; // session_item_id
  workout_item: null | {
    id: number;
    group_id: string;
    exercise_id: string;
    variation_id: string;
    exercise_title: string | null;
    variation_title: string | null;
  };
  sets: TodaySet[];
};

export function TreinosHub() {
  const [groupId, setGroupId] = React.useState<MuscleGroup>("peito");
  const group = workoutCatalog.find((g) => g.id === groupId) ?? workoutCatalog[0]!;

  const [exerciseId, setExerciseId] = React.useState<string>(group.exercises[0]?.id ?? "");
  React.useEffect(() => {
    setExerciseId(group.exercises[0]?.id ?? "");
  }, [groupId, group.exercises]);

  const exercise: WorkoutExercise | null =
    group.exercises.find((e) => e.id === exerciseId) ?? null;

  const [variationId, setVariationId] = React.useState<string>(
    exercise?.variations[0]?.id ?? "",
  );
  React.useEffect(() => {
    setVariationId(exercise?.variations[0]?.id ?? "");
  }, [exerciseId, exercise?.variations]);

  const variation = exercise?.variations.find((v) => v.id === variationId) ?? null;

  const [planItems, setPlanItems] = React.useState<PlanItem[]>([]);
  const [planLoading, setPlanLoading] = React.useState(false);
  const [planError, setPlanError] = React.useState<string | null>(null);
  const [mutating, setMutating] = React.useState(false);

  const refreshPlan = React.useCallback(async () => {
    setPlanError(null);
    setPlanLoading(true);
    try {
      const res = await fetch("/api/workouts/plan");
      if (res.status === 401) {
        window.location.href = "/auth?next=/treinos";
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean; items: PlanItem[] }>;
      if (!data.ok) {
        setPlanError("Não foi possível carregar seu treino.");
        return;
      }
      setPlanItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setPlanError("Falha de rede ao carregar seu treino.");
    } finally {
      setPlanLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshPlan();
  }, [refreshPlan]);

  const [todayItems, setTodayItems] = React.useState<TodayItem[]>([]);
  const [todayLoading, setTodayLoading] = React.useState(false);
  const [todayError, setTodayError] = React.useState<string | null>(null);

  const refreshToday = React.useCallback(async () => {
    setTodayError(null);
    setTodayLoading(true);
    try {
      const res = await fetch("/api/activity/today");
      if (res.status === 401) {
        window.location.href = "/auth?next=/treinos";
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean; items: TodayItem[] }>;
      if (!data.ok) {
        setTodayError("Não foi possível carregar o treino de hoje.");
        return;
      }
      setTodayItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setTodayError("Falha de rede ao carregar treino de hoje.");
    } finally {
      setTodayLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshToday();
  }, [refreshToday]);

  const addSelected = async () => {
    if (!exercise || !variation) return;
    setMutating(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/workouts/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          groupId,
          exerciseId: exercise.id,
          variationId: variation.id,
          exerciseTitle: exercise.title,
          variationTitle: variation.title,
        }),
      });
      if (res.status === 401) {
        window.location.href = "/auth?next=/treinos";
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean; item: PlanItem; error?: string }>;
      if (!data.ok) {
        setPlanError("Não foi possível adicionar ao treino.");
        return;
      }
      setPlanItems((prev) => [data.item as PlanItem, ...prev]);
    } catch {
      setPlanError("Falha de rede ao adicionar.");
    } finally {
      setMutating(false);
    }
  };

  const removeItem = async (id: number) => {
    setMutating(true);
    setPlanError(null);
    try {
      const res = await fetch(`/api/workouts/items?id=${id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/auth?next=/treinos";
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean }>;
      if (!data.ok) {
        setPlanError("Não foi possível remover do treino.");
        return;
      }
      setPlanItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      setPlanError("Falha de rede ao remover.");
    } finally {
      setMutating(false);
    }
  };

  const addPlanItemToToday = async (workoutItemId: number) => {
    setMutating(true);
    setTodayError(null);
    try {
      const res = await fetch("/api/activity/today/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workoutItemId }),
      });
      if (res.status === 401) {
        window.location.href = "/auth?next=/treinos";
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean }>;
      if (!data.ok) {
        setTodayError("Não foi possível adicionar ao treino de hoje.");
        return;
      }
      await refreshToday();
    } catch {
      setTodayError("Falha de rede ao adicionar ao treino de hoje.");
    } finally {
      setMutating(false);
    }
  };

  const [setInputs, setSetInputs] = React.useState<Record<number, { reps: string; weight: string }>>({});
  const setDraft = (sessionItemId: number, next: { reps?: string; weight?: string }) => {
    setSetInputs((prev) => ({
      ...prev,
      [sessionItemId]: {
        reps: next.reps ?? prev[sessionItemId]?.reps ?? "10",
        weight: next.weight ?? prev[sessionItemId]?.weight ?? "20",
      },
    }));
  };

  const addSet = async (sessionItemId: number) => {
    const draft = setInputs[sessionItemId] ?? { reps: "10", weight: "20" };
    const reps = Number(draft.reps);
    const weightKg = Number(draft.weight);
    if (!Number.isFinite(reps) || !Number.isFinite(weightKg)) return;

    setMutating(true);
    try {
      const res = await fetch("/api/activity/today/sets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionItemId, reps, weightKg }),
      });
      if (res.status === 401) {
        window.location.href = "/auth?next=/treinos";
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean }>;
      if (!data.ok) {
        setTodayError("Não foi possível salvar a série.");
        return;
      }
      await refreshToday();
    } catch {
      setTodayError("Falha de rede ao salvar a série.");
    } finally {
      setMutating(false);
    }
  };

  const deleteSet = async (id: number) => {
    setMutating(true);
    try {
      const res = await fetch(`/api/activity/today/sets?id=${id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/auth?next=/treinos";
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean }>;
      if (!data.ok) {
        setTodayError("Não foi possível remover a série.");
        return;
      }
      await refreshToday();
    } catch {
      setTodayError("Falha de rede ao remover a série.");
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-3 pb-8 pt-4 sm:px-4 sm:pb-12 sm:pt-6 lg:px-6 lg:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-medium tracking-wide text-muted-foreground">
            NUTRIPLUS
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
            Hub de Treino
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Navegue por grupo muscular → exercício → variação.
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
            asChild
          >
            <Link href="/dashboard">Voltar</Link>
          </Button>
          <Button className="bg-neon-cyan text-black hover:bg-neon-cyan/90" asChild>
            <Link href="/dieta">
              <Sparkles className="mr-2 h-4 w-4" />
              Dieta & Compras
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Treinos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <PlusGate
        title="Treinos"
        description="Biblioteca completa por grupo muscular, com variações e mídia."
      >
        <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-12">
          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-4">
            <Glow accent={group.accent} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold tracking-tight">
                  Grupo muscular
                </div>
                <Badge className="border-cyber-glass-border bg-black/30 text-neon-cyan">
                  bento nav
                </Badge>
              </div>

              <div className="mt-4 grid gap-2">
                {workoutCatalog.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGroupId(g.id)}
                    className={cn(
                      "rounded-2xl border border-cyber-glass-border bg-black/20 px-4 py-3 text-left transition-colors hover:bg-cyber-glass/40",
                      groupId === g.id &&
                        "border-neon-cyan/35 bg-cyber-glass/45 shadow-[0_0_0_1px_rgba(0,245,255,0.10)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold tracking-tight">
                          {g.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {g.subtitle}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-4">
            <Glow accent="cyan" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold tracking-tight">Exercícios</div>
                <Badge className="border-cyber-glass-border bg-black/30 text-muted-foreground">
                  {group.title}
                </Badge>
              </div>

              <Separator className="my-4 bg-white/10" />

              <div className="grid gap-2">
                {group.exercises.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setExerciseId(e.id)}
                    className={cn(
                      "rounded-2xl border border-cyber-glass-border bg-black/20 px-4 py-3 text-left transition-colors hover:bg-cyber-glass/40",
                      exerciseId === e.id &&
                        "border-neon-violet/35 bg-cyber-glass/45 shadow-[0_0_0_1px_rgba(184,77,255,0.10)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyber-glass-border bg-black/25">
                          <Dumbbell className="h-4 w-4 text-neon-violet" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold tracking-tight">
                            {e.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {e.variations.length} variações
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-4">
            <Glow accent="violet" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold tracking-tight">Variações</div>
                <Badge className="border-cyber-glass-border bg-black/30 text-muted-foreground">
                  {exercise?.title ?? "—"}
                </Badge>
              </div>

              <Separator className="my-4 bg-white/10" />

              <div className="grid gap-2">
                {(exercise?.variations ?? []).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariationId(v.id)}
                    className={cn(
                      "rounded-2xl border border-cyber-glass-border bg-black/20 px-4 py-3 text-left transition-colors hover:bg-cyber-glass/40",
                      variationId === v.id &&
                        "border-neon-green/35 bg-cyber-glass/45 shadow-[0_0_0_1px_rgba(57,255,136,0.10)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold tracking-tight">
                          {v.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          cues: {v.cues.length}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-7">
            <Glow accent="cyan" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  MANEQUIM 3D (placeholder)
                </div>
                <div className="mt-1 text-lg font-semibold tracking-tight">
                  {variation?.title ?? "Selecione uma variação"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Em breve: GIF/vídeo com instrução e pontos de atenção.
                </div>
              </div>
              <Badge className="border-cyber-glass-border bg-black/30 text-neon-cyan">
                cyber
              </Badge>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="relative overflow-hidden rounded-3xl border border-cyber-glass-border bg-black/25 p-6">
              <MannequinPlaceholder />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-5">
            <Glow accent="green" />
            <div className="relative">
              <div className="text-xs font-medium tracking-wide text-muted-foreground">
                INSTRUÇÕES (mock)
              </div>
              <div className="mt-1 text-lg font-semibold tracking-tight">
                Pontos de atenção
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Regras simples que evitam “roubo” e melhoram performance.
              </div>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="relative grid gap-3">
              {(variation?.cues ?? [
                "Escolha um exercício para ver os cues.",
              ]).map((c) => (
                <div
                  key={c}
                  className="rounded-2xl border border-cyber-glass-border bg-black/20 px-4 py-3 text-sm text-muted-foreground"
                >
                  <span className="text-neon-green">•</span> {c}
                </div>
              ))}

              <div className="mt-2 flex gap-2">
                <Button className="bg-neon-green text-black hover:bg-neon-green/90">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Ver demo
                </Button>
                <Button
                  variant="secondary"
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                  onClick={addSelected}
                  disabled={!exercise || !variation || mutating}
                >
                  <Flame className="mr-2 h-4 w-4 text-neon-green" />
                  {mutating ? "Adicionando..." : "Add no treino"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-12">
            <Glow accent="violet" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  MEU TREINO (persistido)
                </div>
                <div className="mt-1 text-lg font-semibold tracking-tight">
                  Itens salvos no Supabase
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="border-cyber-glass-border bg-black/30 text-muted-foreground">
                  {planItems.length} itens
                </Badge>
                <Button
                  variant="secondary"
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                  onClick={refreshPlan}
                  disabled={planLoading}
                >
                  {planLoading ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </div>

            <Separator className="my-5 bg-white/10" />

            {planError ? (
              <div className="rounded-2xl border border-neon-red/30 bg-black/25 px-4 py-3 text-sm text-neon-red">
                {planError}
              </div>
            ) : null}

            <ScrollArea className="h-[260px] pr-2">
              <div className="grid gap-2">
                {planItems.length === 0 && !planLoading ? (
                  <div className="rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-sm text-muted-foreground">
                    Sem itens ainda. Selecione uma variação e clique em{" "}
                    <span className="text-foreground">Add no treino</span>.
                  </div>
                ) : null}

                {planItems.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-cyber-glass-border bg-black/20 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold tracking-tight">
                        {it.exercise_title ?? it.exercise_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {it.variation_title ?? it.variation_id} • {it.group_id}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        className="h-8 border border-cyber-glass-border bg-black/20 px-3 text-xs text-foreground hover:bg-cyber-glass/40"
                        onClick={() => addPlanItemToToday(it.id)}
                        disabled={mutating}
                      >
                        Hoje
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-muted-foreground hover:bg-cyber-glass/35 hover:text-foreground"
                        onClick={() => removeItem(it.id)}
                        disabled={mutating}
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-12">
            <Glow accent="green" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  TREINO DE HOJE
                </div>
                <div className="mt-1 text-lg font-semibold tracking-tight">
                  Sessão do dia (sets/reps/carga)
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Isso alimenta sua streak automaticamente.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="border-cyber-glass-border bg-black/30 text-muted-foreground">
                  {todayItems.length} exercícios
                </Badge>
                <Button
                  variant="secondary"
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                  onClick={refreshToday}
                  disabled={todayLoading}
                >
                  {todayLoading ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </div>

            <Separator className="my-5 bg-white/10" />

            {todayError ? (
              <div className="mb-3 rounded-2xl border border-neon-red/30 bg-black/25 px-4 py-3 text-sm text-neon-red">
                {todayError}
              </div>
            ) : null}

            <ScrollArea className="h-[320px] pr-2">
              <div className="grid gap-3">
                {todayItems.length === 0 && !todayLoading ? (
                  <div className="rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-sm text-muted-foreground">
                    Sem exercícios ainda. Clique em <span className="text-foreground">Hoje</span>{" "}
                    em algum item do seu treino.
                  </div>
                ) : null}

                {todayItems.map((ti) => {
                  const wi = ti.workout_item;
                  const draft = setInputs[ti.id] ?? { reps: "10", weight: "20" };
                  return (
                    <div
                      key={ti.id}
                      className="rounded-3xl border border-cyber-glass-border bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold tracking-tight">
                            {wi?.exercise_title ?? wi?.exercise_id ?? "Exercício"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {wi?.variation_title ?? wi?.variation_id ?? "Variação"} •{" "}
                            {wi?.group_id ?? "—"}
                          </div>
                        </div>
                        <Badge className="border-cyber-glass-border bg-black/30 text-neon-green">
                          {ti.sets.length} sets
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-2">
                        {ti.sets.length ? (
                          <div className="grid gap-2">
                            {ti.sets.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-cyber-glass-border bg-black/25 px-3 py-2"
                              >
                                <div className="text-xs text-muted-foreground">
                                  <span className="text-foreground">Set {s.set_index}</span>{" "}
                                  • {s.reps} reps • {Number(s.weight_kg)} kg
                                </div>
                                <Button
                                  variant="ghost"
                                  className="h-8 text-muted-foreground hover:bg-cyber-glass/35 hover:text-foreground"
                                  onClick={() => deleteSet(s.id)}
                                  disabled={mutating}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Ainda sem sets. Registre o primeiro abaixo.
                          </div>
                        )}

                        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="flex gap-2">
                            <div className="grid gap-1">
                              <div className="text-[10px] font-medium tracking-wide text-muted-foreground">
                                REPS
                              </div>
                              <Input
                                value={draft.reps}
                                onChange={(e) => setDraft(ti.id, { reps: e.target.value })}
                                className="h-9 w-[92px] border-cyber-glass-border bg-black/25"
                                inputMode="numeric"
                              />
                            </div>
                            <div className="grid gap-1">
                              <div className="text-[10px] font-medium tracking-wide text-muted-foreground">
                                KG
                              </div>
                              <Input
                                value={draft.weight}
                                onChange={(e) => setDraft(ti.id, { weight: e.target.value })}
                                className="h-9 w-[92px] border-cyber-glass-border bg-black/25"
                                inputMode="numeric"
                              />
                            </div>
                          </div>
                          <Button
                            className="h-9 bg-neon-green text-black hover:bg-neon-green/90"
                            onClick={() => addSet(ti.id)}
                            disabled={mutating}
                          >
                            + Adicionar set
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </PlusGate>
    </div>
  );
}

function MannequinPlaceholder() {
  return (
    <div className="relative grid min-h-[320px] place-items-center overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--cyber-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--cyber-grid)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(65%_55%_at_50%_40%,black,transparent)]"
      />

      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          animate={{
            rotateY: [0, 15, 0, -15, 0],
            rotateX: [0, 5, 0, -5, 0],
            y: [0, -8, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative grid h-[280px] w-[200px] place-items-center"
          style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
          {/* Glow effect */}
          <div className="absolute -inset-12 rounded-full opacity-60 blur-3xl [background:radial-gradient(circle_at_50%_50%,color-mix(in_oklab,var(--neon-cyan)_25%,transparent),transparent_70%)]" />

          {/* Mannequin body - animated SVG */}
          <svg
            viewBox="0 0 200 280"
            className="relative h-full w-full"
            style={{ filter: "drop-shadow(0 0 20px rgba(0, 245, 255, 0.3))" }}
          >
            {/* Head */}
            <motion.circle
              cx="100"
              cy="40"
              r="25"
              fill="none"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.8"
              animate={{
                opacity: [0.6, 0.9, 0.6],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Neck */}
            <line
              x1="100"
              y1="65"
              x2="100"
              y2="80"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.7"
            />

            {/* Torso */}
            <motion.rect
              x="70"
              y="80"
              width="60"
              height="80"
              fill="none"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.8"
              rx="8"
              animate={{
                opacity: [0.7, 0.9, 0.7],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2,
              }}
            />

            {/* Left arm */}
            <motion.line
              x1="70"
              y1="100"
              x2="40"
              y2="140"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.7"
              animate={{
                x1: [70, 65, 70],
                y2: [140, 145, 140],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.circle
              cx="40"
              cy="140"
              r="12"
              fill="none"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.8"
            />

            {/* Right arm */}
            <motion.line
              x1="130"
              y1="100"
              x2="160"
              y2="140"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.7"
              animate={{
                x1: [130, 135, 130],
                y2: [140, 145, 140],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
            <motion.circle
              cx="160"
              cy="140"
              r="12"
              fill="none"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.8"
            />

            {/* Hips */}
            <rect
              x="75"
              y="160"
              width="50"
              height="30"
              fill="none"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.7"
              rx="6"
            />

            {/* Left leg */}
            <motion.line
              x1="90"
              y1="190"
              x2="80"
              y2="250"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.7"
              animate={{
                x2: [80, 75, 80],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.circle
              cx="80"
              cy="250"
              r="15"
              fill="none"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.8"
            />

            {/* Right leg */}
            <motion.line
              x1="110"
              y1="190"
              x2="120"
              y2="250"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.7"
              animate={{
                x2: [120, 125, 120],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
            />
            <motion.circle
              cx="120"
              cy="250"
              r="15"
              fill="none"
              stroke="rgb(0, 245, 255)"
              strokeWidth="2"
              opacity="0.8"
            />

            {/* Muscle highlight points */}
            {[
              { x: 100, y: 100, delay: 0 },
              { x: 85, y: 120, delay: 0.4 },
              { x: 115, y: 120, delay: 0.6 },
              { x: 100, y: 140, delay: 0.2 },
            ].map((point, idx) => (
              <motion.circle
                key={idx}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="rgb(0, 245, 255)"
                opacity="0.6"
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: point.delay,
                }}
              />
            ))}
          </svg>

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-neon-cyan"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyber-glass-border bg-black/40 px-3 py-1.5 backdrop-blur-sm">
          <Layers3 className="h-3.5 w-3.5 text-neon-cyan" />
          <span className="text-xs font-medium text-neon-cyan">Manequim 3D Animado</span>
        </div>
      </div>
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

