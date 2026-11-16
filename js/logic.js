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
  { id: 'rise', name: 'Rise Again', icon: '🌅' },   // earned again after every comeback
  // Saint badges.
  { id: 'little', name: 'Little Way', by: 'St. Thérèse', icon: '🌸', how: 'Seven days in a row with any tap, however small' },
  { id: 'pio', name: 'Pray, hope, and don’t worry', by: 'St. Padre Pio', icon: '🙏', how: 'Prayer seven days in a row' },
  { id: 'avila', name: 'God alone is enough', by: 'St. Teresa of Avila', icon: '📖', how: 'Thirty days of Scripture reading' },
  { id: 'sun', name: 'Brother Sun', by: 'St. Francis', icon: '☀️', how: 'Twelve morning workouts in one month' },
  { id: 'jp2', name: 'Do not be afraid', by: 'St. John Paul II', icon: '🕊️', how: 'Your first weight milestone reached' },
];

// Days in a row, ending on `d`, for which `test` holds.
export function runTo(S, d, test) {
  let n = 0;
  for (let x = d; n < 400 && test(x); x = addDays(x, -1)) n++;
  return n;
}

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
    little: runTo(S, today, (x) => showedUp(S, x)) >= 7,
    pio: runTo(S, today, (x) => !!S.days[x]?.checks?.prayer) >= 7,
    avila: Object.values(S.days).filter((x) => x.checks?.scripture).length >= 30,
    sun: (() => { let n = 0; for (let x = `${today.slice(0, 8)}01`; x <= today; x = addDays(x, 1)) if (workoutDone(S, x)) n++; return n >= 12; })(),
    jp2: (() => { const m = weightPath(S)[1]; const w = sortedWeighIns(S); return !!(m && w.length && w[w.length - 1].kg <= m.kg && w[w.length - 1].date >= weightPath(S)[0].date); })(),
  };
  const fresh = [];
  // Rise Again: the first tap after three or more quiet days.
  S.rises ||= [];
  if (!S.rises.includes(today) && showedUp(S, today) && gapBefore(S, today) >= RISE_GAP) {
    S.rises.push(today);
    S.badges.rise ||= today;
    fresh.push(BADGES.find((b) => b.id === 'rise'));
  }
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

// ── the year's goals ─────────────────────────────────────────────────────────
export const quarterOf = (date) => Math.floor(parse(date).getMonth() / 3) + 1;

// The weight path: the start point, then each milestone, in date order.
export function weightPath(S) {
  const g = S.config.goals.weight;
  return [{ date: g.startDate, kg: g.startKg }, ...g.milestones]
    .filter((p) => p.date && p.kg > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Where the path says the scale should be on a date; null before it starts.
export function expectedKg(S, date) {
  const p = weightPath(S);
  if (!p.length || date < p[0].date) return null;
  for (let i = 1; i < p.length; i++) {
    if (date > p[i].date) continue;
    const t = daysBetween(p[i - 1].date, date) / Math.max(1, daysBetween(p[i - 1].date, p[i].date));
    return p[i - 1].kg + (p[i].kg - p[i - 1].kg) * t;
  }
  return p[p.length - 1].kg;
}

export function nextMilestone(S, date) {
  const p = weightPath(S).slice(1);
  return p.find((m) => m.date >= date) || null;
}

export const savingsTarget = (S) => S.config.goals.finance.quarters.reduce((a, b) => a + (Number(b) || 0), 0);

export function pace(S, today = todayISO()) {
  const w = sortedWeighIns(S);
  const path = weightPath(S);
  const goal = path[path.length - 1];
  const next = nextMilestone(S, today);
  if (!w.length || !goal) return { text: 'Your first weigh-in starts the line.', expected: null, next };
  const last = w[w.length - 1];
  const expected = expectedKg(S, last.date);
  let text;
  if (last.kg <= goal.kg) text = 'You reached your target. Well done, and steady on.';
  else if (today < path[0].date) text = `Warm-up. The path to ${goal.kg} kg starts on ${fmtDate(path[0].date, { day: 'numeric', month: 'long' })}.`;
  else if (expected == null) text = 'The path has begun. Your next weigh-in puts you on it.';
  else if (last.kg < expected - 1.5) text = 'Ahead of pace. No need to rush, steady is the goal.';
  else if (last.kg <= expected + 0.3) text = 'On pace.';
  else text = "A little behind, and that's okay.";
  return { text, expected, next };
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

// ── the six daily taps ───────────────────────────────────────────────────────
export const MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner'];

// '05:40' → '5:40 am'
export const timeText = (t) => {
  if (!/^\d{1,2}:\d{2}$/.test(t || '')) return t || '';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};

export const inPlanYear = (S, d) => d.slice(0, 4) === String(S.config.goals.year);
export const mondayOf = (d) => addDays(d, -((dow(d) + 6) % 7));

// Morning workouts the plan asks for in the week of `d`; null in the warm-up.
export function weeklyTarget(S, d) {
  return inPlanYear(S, d) ? Number(S.config.goals.fitness.perWeek[quarterOf(d) - 1]) || null : null;
}

// Any logged session counts, any size, any time of day, and so does a walk.
export function workoutDone(S, d) {
  const day = S.days[d];
  return !!(day?.checks?.workout || day?.walk || S.sessions.some((s) => s.date === d));
}

export function workoutsInWeek(S, d) {
  let n = 0;
  for (let x = mondayOf(d); x <= d; x = addDays(x, 1)) if (workoutDone(S, x)) n++;
  return n;
}

// One value per meal: 0 not yet, 1 eaten, 2 eaten with protein.
export function mealsFor(S, d) {
  const m = S.days[d]?.meals || [];
  return Array.from({ length: Number(S.config.goals.eating.meals) || 3 }, (_, i) => m[i] || 0);
}
export const mealName = (i) => MEAL_NAMES[i] || `Meal ${i + 1}`;
export const waterGlasses = (S) => Number(S.config.goals.water?.glasses) || 12;

export function coreFor(S, d) {
  const g = S.config.goals, r = g.rhythm;
  const day = S.days[d] || {};
  const c = day.checks || {};
  const plan = planFor(S, d);
  const meals = mealsFor(S, d);
  const wk = workoutsInWeek(S, d), tgt = weeklyTarget(S, d);
  const what = plan.office ? `Walk${plan.bonus ? ` or ${plan.bonus.name.toLowerCase()}` : ''}`
    : plan.rest ? 'Rest day, a walk counts' : plan.workout?.name || 'Any workout';
  return [
    { id: 'workout', time: timeText(r.workout), label: 'Morning workout', done: workoutDone(S, d),
      cue: `${what} · ${tgt ? `${wk} of ${tgt} this week` : `${wk} this week`}`, workoutId: plan.workout?.id || null },
    { id: 'prayer', time: timeText(r.prayer), label: 'Prayer', done: !!c.prayer },
    { id: 'scripture', time: 'Daily', label: 'Scripture reading', cue: g.scripture.title, done: !!c.scripture },
    { id: 'meals', label: `${meals.length} meals with protein`, done: meals.every((m) => m === 2), meals },
    { id: 'water', label: 'Water', done: (day.water || 0) >= waterGlasses(S) },
    { id: 'lights', time: timeText(r.lightsOut), label: 'Lights out', done: !!c.lights },
  ];
}

// Any tap at all on a day counts as showing up.
export function showedUp(S, d) {
  if (S.sessions.some((s) => s.date === d) || S.weighIns.some((w) => w.date === d)) return true;
  const day = S.days[d];
  if (!day) return false;
  return Object.values(day.checks || {}).some(Boolean) || (day.water || 0) > 0 || (day.meals || []).some(Boolean);
}

export function showedUpThisMonth(S, d) {
  let n = 0;
  for (let x = `${d.slice(0, 8)}01`; x <= d; x = addDays(x, 1)) if (showedUp(S, x)) n++;
  return n;
}

// ── comeback ─────────────────────────────────────────────────────────────────
// Quiet days right before `d`, back to the last day anything was logged.
// 0 when nothing was logged before at all: a first day is not a comeback.
export function gapBefore(S, d) {
  const start = S.meta.startDate;
  if (!start) return 0;
  let n = 0;
  for (let x = addDays(d, -1); x >= start; x = addDays(x, -1)) {
    if (showedUp(S, x)) return n;
    n++;
  }
  return 0;
}
export const RISE_GAP = 3;
// RSV-2CE.
export const RISE_VERSE = { text: 'for a righteous man falls seven times, and rises again; but the wicked are overthrown by calamity.', ref: 'Proverbs 24:16' };

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
