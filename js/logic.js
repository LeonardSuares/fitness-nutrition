// Pure-ish helpers: dates, day type, checklist, streak, badges, pace, stats.
import { PLAN } from '../data/seed.js';
import { QUOTES, VERSES } from '../data/motivation.js';

// ── dates ────────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayISO = () => iso(new Date());
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const dow = (s) => parse(s).getDay();
export const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const fmtDate = (s, opts = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  parse(s).toLocaleDateString(undefined, opts);

// ── day type and plan ────────────────────────────────────────────────────────
export function dayType(S, date) {
  const w = dow(date);
  if (w === 0 || w === 6) return 'weekend';
  return S.days[date]?.type || (S.config.officeDays.includes(w) ? 'office' : 'home');
}

export const workoutById = (S, id) => S.config.workouts.find((w) => w.id === id) || null;

// What is planned for a date: { workout, bonus, rest }
export function planFor(S, date) {
  if (dayType(S, date) === 'office') {
    return { workout: workoutById(S, 'walk'), bonus: workoutById(S, S.config.officeBonus), rest: false, office: true };
  }
  const p = S.config.weeklyPlan[dow(date)] || {};
  const workout = workoutById(S, p.workout);
  return { workout, bonus: null, rest: !workout || !!p.rest, office: false };
}

export function getDay(S, date) {
  return (S.days[date] ||= { checks: {}, water: 0, food: [] });
}

export function dinnerFor(date) {
  const n = daysBetween('2026-01-05', date);
  const list = PLAN.dinners;
  return list[((n % list.length) + list.length) % list.length];
}

// ── Sunday prep (resets each week) ───────────────────────────────────────────
export function prepWeek(date) { return addDays(date, -dow(date)); }
export function prepState(S, date) {
  const week = prepWeek(date);
  if (S.prep.weekOf !== week) S.prep = { weekOf: week, checks: {} };
  return S.prep;
}
export function prepDone(S, date) {
  const p = S.prep.weekOf === prepWeek(date) ? S.prep.checks : {};
  return PLAN.sundayPrep.every((_, i) => p[i]);
}

// ── checklist for a date ─────────────────────────────────────────────────────
export function checklistFor(S, date) {
  const type = dayType(S, date);
  const w = dow(date);
  const checks = S.days[date]?.checks || {};
  const plan = planFor(S, date);
  const out = [];
  for (const item of S.config.checklists[type] || []) {
    if (item.days && !item.days.includes(w)) continue;
    const it = { ...item, done: !!checks[item.id], optional: false, link: null };
    if (item.kind === 'dinner') it.label = `${item.label}: ${dinnerFor(date)}`;
    if (item.kind === 'workout') {
      it.link = 'workout';
      if (plan.office) {
        if (!plan.bonus) continue;
        it.label = `Optional bonus: 1 round of ${plan.bonus.name.toLowerCase()}`;
        it.optional = true;
        it.workoutId = plan.bonus.id;
      } else if (plan.workout && plan.workout.kind !== 'walk') {
        it.label = `${item.label}: ${plan.workout.name}`;
        it.workoutId = plan.workout.id;
      } else continue; // walk-only or rest day: the walk item covers it
    }
    if (item.kind === 'prep') {
      it.link = 'plan';
      it.optional = true;
      it.done = prepDone(S, date);
    }
    out.push(it);
  }
  return out;
}

// ── streak ("never miss twice") ──────────────────────────────────────────────
export function isActive(S, date) {
  return !!S.days[date]?.walk || S.sessions.some((s) => s.date === date);
}

// One missed day does not break the streak; two in a row starts a new one.
// Rest days neither add nor break. Today is never counted as missed.
export function streak(S, today) {
  const start = S.meta.startDate || today;
  let count = 0, misses = 0;
  let d = today;
  if (!isActive(S, d)) d = addDays(d, -1);
  for (; d >= start; d = addDays(d, -1)) {
    if (isActive(S, d)) { count++; misses = 0; }
    else if (planFor(S, d).rest) continue;
    else if (++misses >= 2) break;
  }
  const y = addDays(today, -1);
  const nudge = !isActive(S, today) && y >= start && !isActive(S, y) && !planFor(S, y).rest;
  return { count, nudge };
}

// ── badges ───────────────────────────────────────────────────────────────────
export const BADGES = [
  { id: 'first', name: 'First workout', icon: '🌱' },
  { id: 'week', name: 'First full week', icon: '🗓️' },
  { id: 'w10', name: '10 workouts', icon: '✨' },
  { id: 'w25', name: '25 workouts', icon: '🌟' },
  { id: 'kg1', name: 'First 1 kg lost', icon: '🍃' },
  { id: 'kg5', name: '5 kg lost', icon: '🏔️' },
];

export function weightLost(S) {
  if (!S.weighIns.length) return 0;
  const sorted = [...S.weighIns].sort((a, b) => a.date.localeCompare(b.date));
  return sorted[0].kg - sorted[sorted.length - 1].kg;
}

// Marks newly earned badges and returns them.
export function awardBadges(S) {
  const today = todayISO();
  const n = S.sessions.length;
  const lost = weightLost(S);
  const earned = {
    first: n >= 1,
    week: streak(S, today).count >= 7,
    w10: n >= 10,
    w25: n >= 25,
    kg1: lost >= 1,
    kg5: lost >= 5,
  };
  const fresh = [];
  for (const b of BADGES) {
    if (earned[b.id] && !S.badges[b.id]) { S.badges[b.id] = today; fresh.push(b); }
  }
  return fresh;
}

// ── workout sizes and suggestions ────────────────────────────────────────────
export const SIZES = ['quick', 'standard', 'full'];
export const SIZE_LABEL = { quick: 'Quick', standard: 'Standard', full: 'Full' };

export function defaultSize(S, workoutId, today) {
  const start = S.meta.startDate || today;
  if (daysBetween(start, today) < 28) return 'quick';
  const last = [...S.sessions].reverse().find((s) => s.workoutId === workoutId);
  return last?.size || 'quick';
}

// After two steady weeks of Quick sessions, offer (never force) a step up.
export function shouldSuggest(S, today) {
  const start = S.meta.startDate || today;
  if (daysBetween(start, today) < 14) return false;
  if (S.meta.snoozeSuggestUntil && today < S.meta.snoozeSuggestUntil) return false;
  let active = 0;
  for (let i = 0; i < 14; i++) if (isActive(S, addDays(today, -i))) active++;
  const recent = S.sessions.slice(-3);
  return active >= 8 && recent.length === 3 && recent.every((s) => s.size === 'quick');
}

export function lastEntry(S, exerciseId) {
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const v = S.sessions[i].entries?.[exerciseId];
    if (v != null && v !== '') return v;
  }
  return null;
}

// ── progress ─────────────────────────────────────────────────────────────────
export function sortedWeighIns(S) {
  return [...S.weighIns].sort((a, b) => a.date.localeCompare(b.date));
}

export function pace(S) {
  const w = sortedWeighIns(S);
  if (w.length < 2) return { text: 'Your first weigh-in is in. The line starts here.', expected: null };
  const first = w[0], last = w[w.length - 1];
  const { weightKg, date } = S.config.target;
  const total = Math.max(1, daysBetween(first.date, date));
  const t = Math.min(1, Math.max(0, daysBetween(first.date, last.date) / total));
  const expected = first.kg + (weightKg - first.kg) * t;
  let text;
  if (last.kg <= weightKg) text = 'You reached your target. Well done, and steady on.';
  else if (last.kg < expected - 1.5) text = 'Ahead of pace. No need to rush, steady is the goal.';
  else if (last.kg <= expected + 0.3) text = 'On pace.';
  else text = "A little behind, and that's okay.";
  return { text, expected };
}

export function weighInDue(S, today) {
  if (dow(today) !== S.config.weighInDay) return false;
  return !S.weighIns.some((w) => daysBetween(w.date, today) < 6);
}

export function weekStats(S, today) {
  const monday = addDays(today, -((dow(today) + 6) % 7));
  let workouts = 0, walks = 0, water = 0, ticked = 0, total = 0, n = 0;
  for (let d = monday; d <= today; d = addDays(d, 1)) {
    n++;
    workouts += S.sessions.filter((s) => s.date === d && workoutById(S, s.workoutId)?.kind !== 'walk').length;
    if (S.days[d]?.walk || S.sessions.some((s) => s.date === d && workoutById(S, s.workoutId)?.kind === 'walk')) walks++;
    water += (S.days[d]?.water || 0) * 0.25;
    for (const it of checklistFor(S, d)) {
      if (it.optional) continue;
      total++;
      if (it.done) ticked++;
    }
  }
  return { workouts, walks, waterAvg: water / n, checklistPct: total ? Math.round((ticked / total) * 100) : 0 };
}

// ── motivation ───────────────────────────────────────────────────────────────
// slot 0 = Today screen, slot 1 = workout-complete screen.
export function motivation(S, date, slot) {
  const m = S.config.motivation || {};
  const pool = [
    ...(m.quotes ? QUOTES.map((text) => ({ text })) : []),
    ...(m.verses ? VERSES : []),
  ];
  if (!pool.length) return null;
  const n = daysBetween('2026-01-01', date) * 2 + slot;
  const h = (Math.imul(n + 1, 2654435761) >>> 0) % pool.length;
  return pool[h];
}
