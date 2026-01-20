const KEY = "nutrifit:streak:v1";

type StreakState = {
  count: number;
  lastISO: string; // YYYY-MM-DD
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoToDate(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function diffDays(aISO: string, bISO: string) {
  const a = isoToDate(aISO);
  const b = isoToDate(bISO);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

export function getStreak(): StreakState {
  if (typeof window === "undefined") return { count: 0, lastISO: todayISO() };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { count: 0, lastISO: todayISO() };
    const parsed = JSON.parse(raw) as StreakState;
    if (typeof parsed.count !== "number" || !parsed.lastISO) {
      return { count: 0, lastISO: todayISO() };
    }
    return { count: Math.max(0, parsed.count), lastISO: parsed.lastISO };
  } catch {
    return { count: 0, lastISO: todayISO() };
  }
}

export function setStreak(state: StreakState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function markToday(): StreakState {
  const current = getStreak();
  const today = todayISO();

  if (current.lastISO === today) return current;

  const delta = diffDays(current.lastISO, today);
  const next =
    delta === 1
      ? { count: current.count + 1, lastISO: today }
      : { count: 1, lastISO: today };

  setStreak(next);
  return next;
}

