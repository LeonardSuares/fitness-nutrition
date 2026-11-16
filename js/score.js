// Scorecards: what happened over a span of days, and what the year's plan
// asked of it. Days count only when something was logged; quiet days are
// simply not counted, never marked as missed.
import {
  iso, addDays, todayISO, quarterOf, inPlanYear, coreFor, showedUp, weeklyTarget,
  expectedKg, sortedWeighIns, weightPath, fmtDate,
} from './logic.js';

const pad = (n) => String(n).padStart(2, '0');
export const ymOf = (d) => d.slice(0, 7);
export const monthEnd = (ym) => { const [y, m] = ym.split('-').map(Number); return iso(new Date(y, m, 0)); };
export const addMonths = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const quarterMonths = (year, q) => [1, 2, 3].map((i) => `${year}-${pad((q - 1) * 3 + i)}`);
export const quarterStart = (year, q) => `${year}-${pad((q - 1) * 3 + 1)}-01`;
export const quarterEnd = (year, q) => monthEnd(`${year}-${pad(q * 3)}`);
export const qKey = (d) => `${d.slice(0, 4)}-Q${quarterOf(d)}`;
export const monthLabel = (ym, opts = { month: 'long', year: 'numeric' }) => fmtDate(`${ym}-01`, opts);
export const planYear = (S) => String(S.config.goals.year);
export const money = (S, n) => `${S.config.goals.finance.currency}${Math.round(Number(n) || 0).toLocaleString()}`;

// Counts from `from` to `to`, not past today and not before the first day.
export function tally(S, from, to, today = todayISO()) {
  const first = S.meta.startDate && S.meta.startDate > from ? S.meta.startDate : from;
  const end = to < today ? to : today;
  const t = { days: 0, shown: 0, workouts: 0, prayer: 0, scripture: 0, meals: 0, water: 0, lights: 0, allSix: 0 };
  for (let d = first; d <= end; d = addDays(d, 1)) {
    t.days++;
    if (!showedUp(S, d)) continue;
    t.shown++;
    const done = coreFor(S, d).map((i) => i.done);
    ['workouts', 'prayer', 'scripture', 'meals', 'water', 'lights'].forEach((k, i) => { if (done[i]) t[k]++; });
    if (done.every(Boolean)) t.allSix++;
  }
  return t;
}

// What the plan asks of a span (whole span, inside the plan year only).
export function targets(S, from, to) {
  const g = S.config.goals;
  let n = 0, workouts = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (!inPlanYear(S, d)) continue;
    n++;
    workouts += (weeklyTarget(S, d) || 0) / 7;
  }
  if (!n) return null;
  return { workouts: Math.round(workouts), meals: Math.round((n * (Number(g.eating.daysPerWeek) || 0)) / 7) };
}

export const saved = (S, months) => months.reduce((a, m) => a + (Number(S.savings[m]) || 0), 0);
export function savingsGoal(S, months) {
  const q = S.config.goals.finance.quarters;
  const t = months.filter((m) => m.slice(0, 4) === planYear(S))
    .reduce((a, m) => a + (Number(q[Math.floor((Number(m.slice(5)) - 1) / 3)]) || 0) / 3, 0);
  return t ? Math.round(t) : null;
}

export function weightIn(S, from, to) {
  const w = sortedWeighIns(S).filter((x) => x.date >= from && x.date <= to);
  return {
    first: w[0] || null,
    last: w[w.length - 1] || null,
    path: inPlanYear(S, to) ? expectedKg(S, to) : null,
    milestone: weightPath(S).slice(1).find((p) => p.date >= from && p.date <= to) || null,
  };
}

// ── learning ─────────────────────────────────────────────────────────────────
// One-off items show from the start of their quarter until their due date,
// then in the month they were ticked, and while still open, in the current span.
function window(item, year) {
  const w = item.when || '';
  if (/^m\d+$/.test(w)) {
    const ym = `${year}-${pad(w.slice(1))}`;
    return { from: quarterStart(year, quarterOf(`${ym}-01`)), to: monthEnd(ym), due: `by end of ${monthLabel(ym, { month: 'long' })}` };
  }
  if (/^q[1-4]$/.test(w)) {
    const q = Number(w[1]);
    return { from: quarterStart(year, q), to: quarterEnd(year, q), due: `in Q${q}` };
  }
  return null;
}

export function learningFor(S, from, to, today = todayISO()) {
  const year = planYear(S);
  const a = from > `${year}-01-01` ? from : `${year}-01-01`;
  const b = to < `${year}-12-31` ? to : `${year}-12-31`;
  if (a > b) return [];
  const out = [];
  const add = (it, key, due, group) => out.push({ id: it.id, key, label: it.label, due, group, done: S.learning[key] || null });
  for (const it of S.config.goals.learning) {
    if (it.when === 'monthly') {
      for (let m = ymOf(a); m <= ymOf(b); m = addMonths(m, 1)) add(it, `${it.id}@${m}`, monthLabel(m, { month: 'long' }), true);
    } else if (it.when === 'quarterly') {
      for (let q = quarterOf(a); q <= quarterOf(b); q++) add(it, `${it.id}@${year}-Q${q}`, `Q${q}`, true);
    } else {
      const w = window(it, year);
      if (!w) continue;
      const key = `${it.id}@${year}`, done = S.learning[key];
      const overlaps = w.from <= b && w.to >= a;
      const doneHere = done && done >= a && done <= b;
      const stillOpen = !done && w.to < a && a <= today && today <= b;
      if (overlaps || doneHere || stillOpen) add(it, key, w.due, false);
    }
  }
  return out;
}

// ── month ────────────────────────────────────────────────────────────────────
export function monthSummary(S, ym, today = todayISO()) {
  const from = `${ym}-01`, to = monthEnd(ym);
  const t = tally(S, from, to, today), tg = targets(S, from, to);
  const sv = S.savings[ym], sGoal = savingsGoal(S, [ym]);
  const w = weightIn(S, from, to);
  const q = quarterOf(from), g = S.config.goals;
  const of = (n) => (n != null ? `of ${n}` : '');
  const rows = [
    { label: 'Morning workouts', value: t.workouts, note: of(tg?.workouts) },
    { label: 'Prayer', value: t.prayer, note: 'days' },
    { label: 'Scripture', value: t.scripture, note: 'days' },
    { label: 'Meals with protein', value: t.meals, note: tg ? `of ${tg.meals} days` : 'days' },
    { label: 'Water goal', value: t.water, note: 'days' },
    { label: 'Lights out on time', value: t.lights, note: 'nights' },
  ];
  if (w.last) rows.push({ label: 'Weight', value: `${w.last.kg} kg`, note: w.path != null ? `path ${w.path.toFixed(1)}` : '' });
  if (sv != null) rows.push({ label: 'Saved', value: money(S, sv), note: sGoal ? `of ${money(S, sGoal)}` : '' });
  return {
    ym, from, to, t, tg, rows, saved: sv, savingsGoal: sGoal, weight: w,
    title: monthLabel(ym), tag: from.slice(0, 4) === planYear(S) ? `Q${q} · ${g.themes[q - 1]}` : 'Warm-up',
  };
}

// Calendar cells for a month: level is before | future | none | shown | all.
export function monthDays(S, ym, today = todayISO()) {
  const out = [];
  for (let d = `${ym}-01`; d <= monthEnd(ym); d = addDays(d, 1)) {
    let level = 'none';
    if (d > today) level = 'future';
    else if (S.meta.startDate && d < S.meta.startDate) level = 'before';
    else if (showedUp(S, d)) level = coreFor(S, d).every((i) => i.done) ? 'all' : 'shown';
    out.push({ date: d, day: Number(d.slice(8)), level, today: d === today });
  }
  return out;
}

// 0 nothing, 1 showed up, 2 three or more of the six, 3 all six.
export function dayLevel(S, d) {
  if (!showedUp(S, d)) return 0;
  const n = coreFor(S, d).filter((i) => i.done).length;
  return n >= 6 ? 3 : n >= 3 ? 2 : 1;
}
