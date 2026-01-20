"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShoppingBasket, Sparkles, Target, Utensils } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { PlusGate } from "./plus-gate";

type Goal = "cutting" | "bulking";

type SavedDiet = {
  id: number;
  goal: Goal;
  calories_target: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  plan: unknown;
  groceries: unknown;
  created_at: string;
};

function listFor(goal: Goal) {
  if (goal === "cutting") {
    return {
      title: "Cutting",
      subtitle: "alto volume, proteína alta, calorias controladas.",
      groceries: [
        "frango / patinho moído",
        "ovos",
        "iogurte grego",
        "arroz / batata",
        "legumes (brócolis, abobrinha, cenoura)",
        "folhas (alface, rúcula)",
        "azeite (dosado)",
        "whey (opcional)",
      ],
      meals: [
        { title: "Almoço", desc: "Proteína + carbo controlado + legumes." },
        { title: "Lanche", desc: "Iogurte + fruta (porção) ou whey." },
        { title: "Jantar", desc: "Proteína + salada + carbo baixo/moderado." },
      ],
    };
  }

  return {
    title: "Bulking",
    subtitle: "energia alta, carbo estratégico, recuperação no talo.",
    groceries: [
      "arroz / macarrão",
      "carne / frango",
      "ovos",
      "leite / iogurte",
      "aveia",
      "banana / frutas",
      "pasta de amendoim",
      "azeite",
    ],
    meals: [
      { title: "Almoço", desc: "Carbo alto + proteína + gordura moderada." },
      { title: "Pré-treino", desc: "Carbo fácil + pouca gordura." },
      { title: "Pós-treino", desc: "Proteína + carbo + hidratação." },
    ],
  };
}

export function DietaCompras() {
  const [goal, setGoal] = React.useState<Goal>("cutting");
  const data = listFor(goal);

  const [latest, setLatest] = React.useState<SavedDiet | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<Array<{
    id: number;
    goal: Goal;
    calories_target: number | null;
    created_at: string;
  }>>([]);

  const loadLatest = React.useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/diet/latest");
      if (res.status === 401) {
        window.location.href = "/auth?next=/dieta";
        return;
      }
      const json = (await res.json()) as unknown;
      const parsed = json as Partial<{ ok: boolean; latest: SavedDiet | null }>;
      if (!parsed.ok) return;
      setLatest(parsed.latest ?? null);
    } catch {
      // ignore
    }
  }, []);

  const loadHistory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/diet/history?limit=10");
      if (res.status === 401) {
        window.location.href = "/auth?next=/dieta";
        return;
      }
      const json = (await res.json()) as unknown;
      const parsed = json as Partial<{
        ok: boolean;
        plans: Array<{
          id: number;
          goal: Goal;
          calories_target: number | null;
          created_at: string;
        }>;
      }>;
      if (!parsed.ok) return;
      setHistory(Array.isArray(parsed.plans) ? parsed.plans : []);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    void loadLatest();
    void loadHistory();
  }, [loadLatest, loadHistory]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/diet/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal }),
      });

      if (res.status === 401) {
        window.location.href = "/auth?next=/dieta";
        return;
      }

      if (res.status === 402) {
        setError("NutriPlus necessário para gerar dieta com IA.");
        return;
      }

      const json = (await res.json()) as unknown;
      const parsed = json as Partial<{ ok: boolean; saved: SavedDiet }>;
      if (!parsed.ok) {
        setError("Falha ao gerar dieta. Tente novamente.");
        return;
      }

      if (parsed.saved) {
        setLatest(parsed.saved);
        await loadHistory();
      }
    } catch {
      setError("Falha de rede ao gerar dieta.");
    } finally {
      setLoading(false);
    }
  };

  const mealsFromLatest = parseMeals(latest?.plan);
  const groceriesFromLatest = parseGroceries(latest?.groceries);

  return (
    <div className="mx-auto w-full max-w-7xl px-3 pb-8 pt-4 sm:px-4 sm:pb-12 sm:pt-6 lg:px-6 lg:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-medium tracking-wide text-muted-foreground">
            NUTRIPLUS
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
            Dieta & Compras
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            IA real: gera plano + compras com base na sua biometria.
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
            <Link href="/treinos">
              <Sparkles className="mr-2 h-4 w-4" />
              Hub de Treino
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
              <BreadcrumbPage>Dieta</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <PlusGate
        title="Dieta & Compras"
        description="Lista de compras e plano alimentar por objetivo."
      >
        <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-12">
          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-4">
            <Glow accent="green" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold tracking-tight">Objetivo</div>
                <Badge className="border-cyber-glass-border bg-black/30 text-neon-green">
                  {data.title}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{data.subtitle}</div>

              <Separator className="my-5 bg-white/10" />

              <div className="grid gap-2">
                <GoalButton
                  active={goal === "cutting"}
                  title="Cutting"
                  desc="Definição • déficit inteligente"
                  onClick={() => setGoal("cutting")}
                />
                <GoalButton
                  active={goal === "bulking"}
                  title="Bulking"
                  desc="Massa • superávit limpo"
                  onClick={() => setGoal("bulking")}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-xs text-muted-foreground">
                Dica: a IA usa suas biometria + objetivo para sugerir macros e refeições.
              </div>

              {latest ? (
                <div className="mt-4 rounded-2xl border border-cyber-glass-border bg-black/20 p-4 text-xs text-muted-foreground">
                  Última geração:{" "}
                  <span className="text-foreground">
                    {new Date(latest.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-8">
            <Glow accent="cyan" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  PLANO (IA)
                </div>
                <div className="mt-1 text-lg font-semibold tracking-tight">
                  Sugestões de refeições
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Refeições geradas sob medida (salvas no Supabase).
                </div>
              </div>
              <Badge className="border-cyber-glass-border bg-black/30 text-neon-cyan">
                bento
              </Badge>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="grid gap-3 sm:grid-cols-3">
              {(mealsFromLatest?.length ? mealsFromLatest : data.meals.map((m) => ({ title: m.title, desc: m.desc }))).map((m) => (
                <motion.div
                  key={m.title}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                  className="rounded-3xl border border-cyber-glass-border bg-black/20 p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyber-glass-border bg-black/25">
                      <Utensils className="h-5 w-5 text-neon-violet" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-tight">
                        {m.title}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.desc}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {latest
                  ? `Meta: ${latest.calories_target ?? "—"} kcal • P ${latest.protein_g ?? "—"}g • C ${latest.carbs_g ?? "—"}g • G ${latest.fats_g ?? "—"}g`
                  : "Gere sua dieta agora com IA (NutriPlus)."}
              </div>
              <Button
                className="bg-neon-violet text-black hover:bg-neon-violet/90"
                onClick={generate}
                disabled={loading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? "Gerando..." : "Gerar dieta com IA"}
              </Button>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-neon-red/30 bg-black/25 px-4 py-3 text-sm text-neon-red">
                {error}
              </div>
            ) : null}
          </Card>

          <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-12">
            <Glow accent="violet" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  LISTA DE COMPRAS (IA)
                </div>
                <div className="mt-1 text-lg font-semibold tracking-tight">
                  Lista semanal
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Baseada no plano gerado e no seu objetivo.
                </div>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyber-glass-border bg-black/25">
                <ShoppingBasket className="h-5 w-5 text-neon-green" />
              </div>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(groceriesFromLatest?.length ? groceriesFromLatest : data.groceries).map((g) => (
                <div
                  key={g}
                  className="rounded-2xl border border-cyber-glass-border bg-black/20 px-4 py-3 text-sm text-muted-foreground"
                >
                  <span className="text-neon-cyan">•</span> {g}
                </div>
              ))}
            </div>
          </Card>

          {history.length > 0 ? (
            <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-4 sm:p-6 backdrop-blur-xl lg:col-span-12">
              <Glow accent="cyan" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-medium tracking-wide text-muted-foreground">
                    HISTÓRICO DE DIETAS
                  </div>
                  <div className="mt-1 text-lg font-semibold tracking-tight">
                    Planos anteriores
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Visualize suas gerações anteriores.
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                  onClick={loadHistory}
                >
                  Atualizar
                </Button>
              </div>

              <Separator className="my-5 bg-white/10" />

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {history.map((h) => (
                  <motion.div
                    key={h.id}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 240, damping: 18 }}
                    className="rounded-2xl border border-cyber-glass-border bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        className={cn(
                          "border-cyber-glass-border bg-black/30",
                          h.goal === "cutting" ? "text-neon-green" : "text-neon-violet",
                        )}
                      >
                        {h.goal}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-semibold tracking-tight">
                      {h.calories_target ?? "—"} kcal
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {h.id === latest?.id ? "Atual" : "Anterior"}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </PlusGate>
    </div>
  );
}

function parseMeals(plan: unknown): Array<{ title: string; desc: string }> | null {
  if (!plan || typeof plan !== "object") return null;
  const obj = plan as Record<string, unknown>;
  const meals = obj.meals;
  if (!Array.isArray(meals)) return null;
  return meals
    .map((m) => {
      if (!m || typeof m !== "object") return null;
      const mm = m as Record<string, unknown>;
      const title = typeof mm.title === "string" ? mm.title : "Refeição";
      const items = Array.isArray(mm.items)
        ? mm.items.filter((x) => typeof x === "string").slice(0, 4)
        : [];
      const desc =
        items.length > 0 ? items.join(", ") : typeof mm.notes === "string" ? mm.notes : "";
      return { title, desc };
    })
    .filter((x): x is { title: string; desc: string } => !!x);
}

function parseGroceries(groceries: unknown): string[] | null {
  if (!Array.isArray(groceries)) return null;
  return groceries.filter((x) => typeof x === "string");
}

function GoalButton({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-cyber-glass-border bg-black/20 px-4 py-3 text-left transition-colors hover:bg-cyber-glass/40",
        active && "border-neon-green/35 bg-cyber-glass/45 shadow-[0_0_0_1px_rgba(57,255,136,0.10)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyber-glass-border bg-black/25">
            <Target className={cn("h-4 w-4", active ? "text-neon-green" : "text-muted-foreground")} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">{title}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
        </div>
        <Chevron active={active} />
      </div>
    </button>
  );
}

function Chevron({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "h-2 w-2 rotate-45 border-r-2 border-t-2",
        active ? "border-neon-green" : "border-muted-foreground/60",
      )}
    />
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

