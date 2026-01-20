import type { OnboardingDraft } from "@/components/onboarding/types";

const DRAFT_KEY = "nutrifit:onboarding-draft:v1";
const PLAN_KEY = "nutrifit:plan:v1";

export type PlanType = "free" | "plus";

export function getLocalProfile(): {
  nome: string;
  nomeAssistente: string;
  email: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as OnboardingDraft;
    return {
      nome: draft.nome ?? "",
      nomeAssistente: draft.nomeAssistente ?? "",
      email: draft.email ?? "",
    };
  } catch {
    return null;
  }
}

export function getPlan(): PlanType {
  if (typeof window === "undefined") return "free";
  const v = window.localStorage.getItem(PLAN_KEY);
  return v === "plus" ? "plus" : "free";
}

export function setPlan(plan: PlanType) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAN_KEY, plan);
}

