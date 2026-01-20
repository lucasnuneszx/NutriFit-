const USAGE_KEY = "nutrifit:usage:vision-scan:v1";

type UsageState = {
  weekId: string; // e.g. "2026-W03"
  count: number;
};

function getWeekId(d: Date) {
  // Simple ISO week id (good enough for UI mock)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getUsageNow(): UsageState {
  if (typeof window === "undefined") return { weekId: getWeekId(new Date()), count: 0 };
  const nowWeek = getWeekId(new Date());
  try {
    const raw = window.localStorage.getItem(USAGE_KEY);
    if (!raw) return { weekId: nowWeek, count: 0 };
    const parsed = JSON.parse(raw) as UsageState;
    if (!parsed.weekId || typeof parsed.count !== "number") {
      return { weekId: nowWeek, count: 0 };
    }
    if (parsed.weekId !== nowWeek) return { weekId: nowWeek, count: 0 };
    return { weekId: nowWeek, count: Math.max(0, parsed.count) };
  } catch {
    return { weekId: nowWeek, count: 0 };
  }
}

export function setUsage(state: UsageState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USAGE_KEY, JSON.stringify(state));
}

export function incrementUsage(): UsageState {
  const current = getUsageNow();
  const next = { ...current, count: current.count + 1 };
  setUsage(next);
  return next;
}

export function resetUsage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USAGE_KEY);
}

