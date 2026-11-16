import { S } from './store.js';
import { esc, commit, toast, render as rerender, deliverFile } from './core.js';
import {
  todayISO, sortedWeighIns, pace, weightPath, daysBetween, fmtDate, BADGES, DAY_NAMES,
  quarterOf, addDays, mondayOf, weeklyTarget, workoutsInWeek,
} from './logic.js';
import * as SC from './score.js';
import { monthImage } from './share.js';

// Which scorecard is showing, and for when.
let view = 'month';
let ym = null;      // "YYYY-MM"
let qk = null;      // "YYYY-Qn"
let yr = null;      // "YYYY"
let pending = null;

export function openOn(v, key) { pending = { v, key }; }

export function enter() {
  const d = todayISO();
  view = pending?.v || 'month';
  ym = view === 'month' && pending?.key ? pending.key : SC.ymOf(d);
  qk = view === 'quarter' && pending?.key ? pending.key : SC.qKey(d);
  yr = view === 'year' && pending?.key ? pending.key : d.slice(0, 4);
  pending = null;
}

// ── weight ───────────────────────────────────────────────────────────────────
function chart() {
  const w = sortedWeighIns(S);
  if (!w.length) return '';
  // The dashed path runs from the start weight through each quarter milestone.
  const path = weightPath(S);
  const from = path[0] || w[0], goal = path[path.length - 1] || w[w.length - 1];
  const dates = [...w, ...path].map((p) => p.date).sort();
  const first = dates[0], end = dates[dates.length - 1];
  const span = Math.max(1, daysBetween(first, end));
  const kgs = [...w, ...path].map((p) => p.kg);
  const lo = Math.min(...kgs) - 1, hi = Math.max(...kgs) + 1;
  const W = 340, H = 180, L = 34, R = 12, T = 12, B = 24;
  const x = (d) => L + (daysBetween(first, d) / span) * (W - L - R);
  const y = (kg) => T + ((hi - kg) / (hi - lo)) * (H - T - B);
  const xy = (p) => `${x(p.date).toFixed(1)},${y(p.kg).toFixed(1)}`;
  const last = w[w.length - 1];
  const mid = path.slice(1, -1);
  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend, with the path from ${from.kg} kg to ${goal.kg} kg">
      <line class="grid" x1="${L}" x2="${W - R}" y1="${y(from.kg)}" y2="${y(from.kg)}"/>
      <line class="grid" x1="${L}" x2="${W - R}" y1="${y(goal.kg)}" y2="${y(goal.kg)}"/>
      <text class="axis" x="${L - 6}" y="${y(from.kg) + 4}" text-anchor="end">${from.kg}</text>
      <text class="axis" x="${L - 6}" y="${y(goal.kg) + 4}" text-anchor="end">${goal.kg}</text>
      ${path.length > 1 ? `<polyline class="target" points="${path.map(xy).join(' ')}"/>` : ''}
      ${mid.map((p) => `<circle class="ms" cx="${x(p.date).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="3"/>
        <text class="axis" x="${(x(p.date) + 6).toFixed(1)}" y="${(y(p.kg) - 6).toFixed(1)}">${p.kg}</text>`).join('')}
      ${w.length > 1 ? `<polyline class="trend" points="${w.map(xy).join(' ')}"/>` : ''}
      ${w.map((p) => `<circle class="pt" cx="${x(p.date).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="3"/>`).join('')}
      <circle class="pt now" cx="${x(last.date).toFixed(1)}" cy="${y(last.kg).toFixed(1)}" r="5"/>
      <text class="axis" x="${L}" y="${H - 6}">${esc(fmtDate(first, { day: 'numeric', month: 'short' }))}</text>
      <text class="axis" x="${W - R}" y="${H - 6}" text-anchor="end">${esc(fmtDate(end, { month: 'short', year: 'numeric' }))}</text>
    </svg>
    <p class="legend"><span class="key solid"></span>You <span class="key dashed"></span>Path to ${goal.kg} kg</p>`;
}

function weightCards(d) {
  const w = sortedWeighIns(S);
  const p = pace(S, d);
  const recent = w.slice(-5).reverse();
  return `
    <section class="card">
      ${chart()}
      <p class="pace">${esc(p.text)}</p>
      ${p.next ? `<p class="muted">Next milestone: ${p.next.kg} kg by ${esc(fmtDate(p.next.date, { day: 'numeric', month: 'long' }))}.</p>` : ''}
    </section>

    <section class="card">
      <div class="card-head"><h2>Weigh-in</h2><span class="muted">${DAY_NAMES[S.config.weighInDay]} mornings</span></div>
      <div class="inline-form">
        <input id="kg" type="number" inputmode="decimal" step="0.1" min="30" max="250" placeholder="kg" aria-label="Weight in kg">
        <button class="btn primary" data-act="weigh">Save</button>
      </div>
      ${recent.length ? `<ul class="plain small">${recent.map((x) => `
        <li><span>${esc(fmtDate(x.date, { day: 'numeric', month: 'short', year: 'numeric' }))}</span><span>${x.kg} kg
          ${w.length > 1 ? `<button class="x" data-act="delWeigh" data-date="${x.date}" aria-label="Remove this weigh-in">×</button>` : ''}</span></li>`).join('')}</ul>` : ''}
    </section>`;
}

// ── shared bits ──────────────────────────────────────────────────────────────
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function learnList(items, { title = 'Learning', grouped = false } = {}) {
  if (!items.length) return '';
  let rows;
  if (grouped) {
    // Repeating items roll up into one line: "LinkedIn post: 5 of 12".
    const seen = new Map();
    for (const it of items) {
      if (!it.group) { seen.set(it.key, it); continue; }
      const g = seen.get(it.id) || { ...it, n: 0, of: 0, rollup: true };
      g.of++; if (it.done) g.n++;
      seen.set(it.id, g);
    }
    rows = [...seen.values()].map((it) => it.rollup
      ? `<li><span class="grow">${esc(it.label)}</span><span class="val">${it.n} <span class="muted">of ${it.of}</span></span></li>`
      : `<li><span class="grow">${esc(it.label)}<br><span class="muted">${esc(it.due)}</span></span><span class="val">${it.done ? '✓ Done' : '<span class="muted">Open</span>'}</span></li>`).join('');
    return `<section class="card"><h2>${title}</h2><ul class="plain score-rows">${rows}</ul></section>`;
  }
  rows = items.map((it) => `
    <button class="row ${it.done ? 'done' : ''}" data-act="learn" data-key="${esc(it.key)}" aria-pressed="${!!it.done}">
      <span class="box" aria-hidden="true"></span>
      <span class="row-text"><span class="lbl">${esc(it.label)}</span><span class="cue">${it.done ? `Done ${esc(fmtDate(it.done, { day: 'numeric', month: 'short' }))}` : esc(it.due)}</span></span>
    </button>`).join('');
  return `<section class="card learn"><h2>${title}</h2>${rows}</section>`;
}

function navRow(label, canPrev, canNext) {
  return `
    <div class="nav-row">
      <button class="x" data-act="step" data-by="-1" aria-label="Earlier" ${canPrev ? '' : 'disabled'}>‹</button>
      <h2>${esc(label)}</h2>
      <button class="x" data-act="step" data-by="1" aria-label="Later" ${canNext ? '' : 'disabled'}>›</button>
    </div>`;
}

// The range the scorecards can show: from the first day used to the end of the plan year.
function bounds(d) {
  const first = S.meta.startDate || d;
  const lastYm = `${SC.planYear(S)}-12` > SC.ymOf(d) ? `${SC.planYear(S)}-12` : SC.ymOf(d);
  return { first, minYm: SC.ymOf(first), maxYm: lastYm };
}

// ── month ────────────────────────────────────────────────────────────────────
function monthView(d) {
  const b = bounds(d);
  const s = SC.monthSummary(S, ym, d);
  const days = SC.monthDays(S, ym, d);
  const lead = (new Date(`${ym}-01T12:00:00`).getDay() + 6) % 7;
  const cal = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l) => `<span class="wd">${l}</span>`).join('')
    + '<span></span>'.repeat(lead)
    + days.map((x) => `<span class="cal-d ${x.level}${x.today ? ' today' : ''}" title="${x.date}">${x.day}</span>`).join('');
  const started = s.t.days > 0;
  const g = S.config.goals;
  const sGoal = s.savingsGoal;

  return `
    ${navRow(s.title, ym > b.minYm, ym < b.maxYm)}
    <section class="card">
      <p class="eyebrow">${esc(s.tag)}</p>
      ${started ? `<div class="score-top"><span class="big">${s.t.shown}</span><span>${s.t.shown === 1 ? 'day' : 'days'} showed up${s.t.allSix ? `, all six on ${s.t.allSix}` : ''}</span></div>`
        : `<p class="muted">${ym > SC.ymOf(d) ? 'Still ahead. It starts fresh when it comes.' : 'Before your first day.'}</p>`}
      <div class="cal" aria-label="Days you showed up">${cal}</div>
      ${started ? `<ul class="plain score-rows">${s.rows.map((r) => `
        <li><span class="grow">${esc(r.label)}</span><span class="val">${esc(r.value)} <span class="muted">${esc(r.note)}</span></span></li>`).join('')}</ul>` : ''}
      ${s.tg ? `<p class="hint tight">Targets this month: ${plural(s.tg.workouts, 'morning workout')}, and three meals with protein on ${s.tg.meals} days.</p>` : started ? '<p class="hint tight">Warm-up month: no targets, just showing up.</p>' : ''}
      ${started ? '<button class="btn soft big-btn" data-act="share">Share this month</button>' : ''}
    </section>

    <section class="card">
      <div class="card-head"><h2>Saved this month</h2>${sGoal ? `<span class="muted">target ${esc(SC.money(S, sGoal))}</span>` : ''}</div>
      <div class="inline-form">
        <input id="saved" type="number" inputmode="decimal" step="1" min="0" placeholder="${esc(g.finance.currency)}" aria-label="Amount saved this month"
          value="${s.saved != null ? esc(s.saved) : ''}">
        <button class="btn primary" data-act="saveMonth">Save</button>
      </div>
      <p class="hint tight">One number for the whole month. Change it any time.</p>
    </section>

    ${learnList(SC.learningFor(S, s.from, s.to, d))}`;
}

// ── quarter ──────────────────────────────────────────────────────────────────
function quarterView(d) {
  const b = bounds(d);
  const [y, qs] = qk.split('-Q');
  const q = Number(qs);
  const g = S.config.goals;
  const months = SC.quarterMonths(y, q);
  const from = SC.quarterStart(y, q), to = SC.quarterEnd(y, q);
  const per = months.map((m) => SC.tally(S, `${m}-01`, SC.monthEnd(m), d));
  const tot = SC.tally(S, from, to, d);
  const tg = SC.targets(S, from, to);
  const inYear = y === SC.planYear(S);
  const sGoal = SC.savingsGoal(S, months);
  const w = SC.weightIn(S, from, to);
  const ended = to < d, ahead = from > d;
  const mName = (m) => SC.monthLabel(m, { month: 'short' });
  const money = (v) => (v == null ? '–' : esc(SC.money(S, v)));
  const row = (label, k) => `<tr><th>${label}</th>${per.map((t) => `<td>${t[k]}</td>`).join('')}<td>${tot[k]}</td></tr>`;
  const [ny, nq] = q === 4 ? [String(Number(y) + 1), 1] : [y, q + 1];
  const nextQ = `${ny} Q${nq}`;
  const nextTheme = ny === SC.planYear(S) ? ` · ${g.themes[nq - 1]}` : '';
  const anySaved = months.some((m) => S.savings[m] != null);

  const goals = inYear ? `
    <section class="card">
      <h2>Against the plan</h2>
      <ul class="plain score-rows">
        <li><span class="grow">Morning workouts<br><span class="muted">${g.fitness.perWeek[q - 1]} a week</span></span><span class="val">${tot.workouts} <span class="muted">of ${tg.workouts}</span></span></li>
        <li><span class="grow">Meals with protein<br><span class="muted">${g.eating.daysPerWeek} days a week</span></span><span class="val">${tot.meals} <span class="muted">of ${tg.meals} days</span></span></li>
        ${sGoal ? `<li><span class="grow">Saved</span><span class="val">${money(SC.saved(S, months))} <span class="muted">of ${money(sGoal)}</span></span></li>` : ''}
        ${w.milestone ? `<li><span class="grow">Weight<br><span class="muted">${w.milestone.kg} kg by ${esc(fmtDate(w.milestone.date, { day: 'numeric', month: 'short' }))}</span></span><span class="val">${w.last ? `${w.last.kg} kg` : '<span class="muted">no weigh-in yet</span>'}</span></li>` : ''}
      </ul>
    </section>` : '';

  return `
    ${navRow(`Q${q} ${y}`, months[0] > b.minYm, months[2] < b.maxYm)}
    <section class="card">
      <p class="eyebrow">${inYear ? esc(g.themes[q - 1]) : 'Warm-up'}</p>
      ${ahead ? '<p class="muted">Still ahead. It starts fresh when it comes.</p>'
        : `<div class="score-top"><span class="big">${tot.shown}</span><span>${tot.shown === 1 ? 'day' : 'days'} showed up${tot.allSix ? `, all six on ${tot.allSix}` : ''}</span></div>`}
      <table class="qtable">
        <thead><tr><th></th>${months.map((m) => `<th>${esc(mName(m))}</th>`).join('')}<th>All</th></tr></thead>
        <tbody>
          ${row('Showed up', 'shown')}
          ${row('Workouts', 'workouts')}
          ${row('Prayer', 'prayer')}
          ${row('Scripture', 'scripture')}
          ${row('Meals ✓', 'meals')}
          ${row('Water', 'water')}
          ${row('Lights out', 'lights')}
          <tr><th>Saved</th>${months.map((m) => `<td>${money(S.savings[m])}</td>`).join('')}<td>${anySaved ? money(SC.saved(S, months)) : '–'}</td></tr>
        </tbody>
      </table>
      ${ended ? `<p class="hint tight">This quarter is closed, whatever it held. ${esc(nextQ)}${esc(nextTheme)} starts fresh.</p>`
        : !inYear && !ahead ? '<p class="hint tight">Warm-up quarter: no targets, just showing up.</p>' : ''}
    </section>
    ${goals}
    ${learnList(SC.learningFor(S, from, to, d), { title: 'Learning this quarter' })}`;
}

// ── year ─────────────────────────────────────────────────────────────────────
function heatmap(y, d) {
  const from = `${y}-01-01`, to = `${y}-12-31`;
  const start = mondayOf(from);
  const cols = Math.ceil((daysBetween(start, to) + 1) / 7);
  const cell = 10, gap = 2, top = 12, L = 14;
  const cells = [], marks = [], labels = [];
  for (let c = 0; c < cols; c++) {
    const monday = addDays(start, c * 7);
    for (let r = 0; r < 7; r++) {
      const day = addDays(monday, r);
      if (day < from || day > to) continue;
      const out = day > d || (S.meta.startDate && day < S.meta.startDate);
      const cls = out ? 'hx' : `h${SC.dayLevel(S, day)}`;
      cells.push(`<rect class="${cls}" x="${L + c * (cell + gap)}" y="${top + r * (cell + gap)}" width="${cell}" height="${cell}" rx="2"><title>${day}</title></rect>`);
    }
    // A small bar under each week that met its workout target.
    const sunday = addDays(monday, 6);
    const tgt = weeklyTarget(S, monday < from ? from : monday);
    const end = sunday < d ? sunday : d;
    if (tgt && end >= monday && workoutsInWeek(S, end) >= tgt) {
      marks.push(`<rect class="wk" x="${L + c * (cell + gap)}" y="${top + 7 * (cell + gap) + 2}" width="${cell}" height="3" rx="1.500"/>`);
    }
    if (monday.slice(8) <= '07' || c === 0) {
      const m = (monday < from ? from : monday).slice(0, 7);
      if (!labels.some((l) => l.m === m)) labels.push({ m, x: L + c * (cell + gap) });
    }
  }
  const W = L + cols * (cell + gap), H = top + 7 * (cell + gap) + 8;
  return `
    <svg class="heat" viewBox="0 0 ${W} ${H}" role="img" aria-label="Every day of ${y}: darker means more of the six">
      ${labels.map((l) => `<text x="${l.x}" y="8">${esc(SC.monthLabel(l.m, { month: 'narrow' }))}</text>`).join('')}
      ${['M', 'W', 'F'].map((t, i) => `<text x="0" y="${top + (i * 2) * (cell + gap) + 9}">${t}</text>`).join('')}
      ${cells.join('')}${marks.join('')}
    </svg>
    <p class="legend">Lighter: showed up · darker: more of the six · bar: week's workouts met</p>`;
}

function yearView(d) {
  const b = bounds(d);
  const g = S.config.goals;
  const y = yr, inYear = y === SC.planYear(S);
  const from = `${y}-01-01`, to = `${y}-12-31`;
  const tot = SC.tally(S, from, to, d);
  const months = Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`);
  const allMonths = months;
  const st = g.finance.stretch;
  const decision = { go: 'Go', no: 'Not this year' }[st.decision] || 'Not decided yet';

  const quarters = [1, 2, 3, 4].map((q) => {
    const qf = SC.quarterStart(y, q), qt = SC.quarterEnd(y, q);
    const t = SC.tally(S, qf, qt, d), tg = SC.targets(S, qf, qt);
    const qm = SC.quarterMonths(y, q), sGoal = SC.savingsGoal(S, qm);
    const w = SC.weightIn(S, qf, qt);
    const now = qf <= d && d <= qt;
    const head = `<h3>Q${q}${inYear ? ` · ${esc(g.themes[q - 1])}` : ''}</h3>`;
    if (qf > d) {
      // Not started: show what is planned, not a row of zeros.
      return `
      <button class="qcard" data-act="seeQuarter" data-k="${y}-Q${q}">
        ${head}
        <p class="qbig"><span class="muted">Ahead</span></p>
        ${tg ? `<p>${g.fitness.perWeek[q - 1]} workouts a week</p>` : ''}
        ${sGoal ? `<p>Save ${esc(SC.money(S, sGoal))}</p>` : ''}
        ${w.milestone ? `<p>${w.milestone.kg} kg by ${esc(fmtDate(w.milestone.date, { day: 'numeric', month: 'short' }))}</p>` : ''}
      </button>`;
    }
    return `
      <button class="qcard ${now ? 'now' : ''}" data-act="seeQuarter" data-k="${y}-Q${q}">
        ${head}
        <p class="qbig">${t.shown} <span class="muted">${t.shown === 1 ? 'day' : 'days'}</span></p>
        <p>${t.workouts}${tg ? ` of ${tg.workouts}` : ''} workouts</p>
        ${sGoal ? `<p>${esc(SC.money(S, SC.saved(S, qm)))} of ${esc(SC.money(S, sGoal))}</p>` : ''}
        ${w.milestone ? `<p>${w.last ? `${w.last.kg}` : '–'} / ${w.milestone.kg} kg</p>` : ''}
      </button>`;
  }).join('');

  const bars = months.map((m) => {
    const t = SC.tally(S, `${m}-01`, SC.monthEnd(m), d);
    const daysIn = Number(SC.monthEnd(m).slice(8));
    return `
      <button class="mbar" data-act="seeMonth" data-k="${m}">
        <span>${esc(SC.monthLabel(m, { month: 'short' }))}</span>
        <span class="track"><span class="fill" style="width:${Math.round((t.shown / daysIn) * 100)}%"></span></span>
        <span class="muted">${t.shown ? `${t.shown} d · ${t.workouts} w` : ''}</span>
      </button>`;
  }).join('');

  const yGoal = SC.savingsGoal(S, allMonths);
  return `
    ${navRow(y, y > b.minYm.slice(0, 4), y < b.maxYm.slice(0, 4))}
    <section class="card">
      <p class="eyebrow">${inYear ? esc(g.word) : 'Warm-up'}</p>
      <div class="score-top"><span class="big">${tot.shown}</span><span>${tot.shown === 1 ? 'day' : 'days'} showed up${tot.allSix ? `, all six on ${tot.allSix}` : ''}</span></div>
      ${heatmap(y, d)}
    </section>
    <div class="qgrid">${quarters}</div>
    <section class="card">
      <h2>Months</h2>
      ${bars}
      <p class="hint tight">d: days showed up · w: morning workouts</p>
    </section>
    ${inYear ? `
    <section class="card">
      <h2>Savings</h2>
      <ul class="plain score-rows">
        <li><span class="grow">Saved this year</span><span class="val">${esc(SC.money(S, SC.saved(S, allMonths)))}${yGoal ? ` <span class="muted">of ${esc(SC.money(S, yGoal))}</span>` : ''}</span></li>
        ${st.name ? `<li><span class="grow">${esc(st.name)}</span><span class="val">${esc(decision)}</span></li>` : ''}
      </ul>
    </section>` : ''}
    ${learnList(SC.learningFor(S, from, to, d), { title: 'Learning this year', grouped: true })}`;
}

// ── page ─────────────────────────────────────────────────────────────────────
export function render() {
  const d = todayISO();
  if (!ym) enter();
  const w = sortedWeighIns(S);
  const last = w[w.length - 1];
  const seg = ['month', 'quarter', 'year'].map((v) =>
    `<button data-act="view" data-v="${v}" aria-pressed="${view === v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('');
  const rises = (S.rises || []).length;

  return `
    <header class="head"><div><p class="eyebrow">Progress</p><h1>${last ? `${last.kg} kg` : 'No weigh-in yet'}</h1></div></header>

    <div class="seg wide" role="group" aria-label="Scorecard">${seg}</div>
    ${{ month: monthView, quarter: quarterView, year: yearView }[view](d)}

    ${weightCards(d)}

    <section class="card">
      <h2>Badges</h2>
      <div class="badges">${BADGES.map((b) => `
        <div class="badge ${S.badges[b.id] ? 'on' : ''}"><span class="badge-icon">${b.icon}</span><span>${esc(b.name)}${b.id === 'rise' && rises > 1 ? ` ×${rises}` : ''}</span>${b.by ? `<span class="by">${esc(b.by)}</span>` : ''}</div>`).join('')}
      </div>
    </section>`;
}

const clampYm = (m, b) => (m < b.minYm ? b.minYm : m > b.maxYm ? b.maxYm : m);

export const actions = {
  view(el) { view = el.dataset.v; rerender(); },
  step(el) {
    const by = Number(el.dataset.by), b = bounds(todayISO());
    if (view === 'month') ym = clampYm(SC.addMonths(ym, by), b);
    if (view === 'quarter') {
      const [y, q] = qk.split('-Q').map(Number);
      const n = y * 4 + (q - 1) + by;
      qk = `${Math.floor(n / 4)}-Q${(n % 4) + 1}`;
    }
    if (view === 'year') yr = String(Number(yr) + by);
    rerender();
  },
  seeQuarter(el) { view = 'quarter'; qk = el.dataset.k; rerender(); window.scrollTo(0, 0); },
  seeMonth(el) { view = 'month'; ym = el.dataset.k; rerender(); window.scrollTo(0, 0); },
  weigh() {
    const kg = Math.round(parseFloat(document.getElementById('kg').value) * 10) / 10;
    if (!kg || kg < 30 || kg > 250) return toast('Enter your weight in kg');
    const d = todayISO();
    S.weighIns = S.weighIns.filter((x) => x.date !== d);
    S.weighIns.push({ date: d, kg });
    commit();
    toast('Weigh-in saved');
  },
  delWeigh(el) {
    S.weighIns = S.weighIns.filter((x) => x.date !== el.dataset.date);
    commit();
  },
  saveMonth() {
    const raw = document.getElementById('saved').value.trim();
    if (raw === '') { delete S.savings[ym]; commit(); return toast('Cleared'); }
    const v = Math.round(parseFloat(raw) * 100) / 100;
    if (!(v >= 0)) return toast('Enter an amount');
    S.savings[ym] = v;
    commit();
    toast(`Saved for ${SC.monthLabel(ym, { month: 'long' })}`);
  },
  learn(el) {
    const k = el.dataset.key;
    if (S.learning[k]) delete S.learning[k]; else S.learning[k] = todayISO();
    commit();
  },
  async share() {
    const blob = await monthImage(S, ym, todayISO());
    const how = await deliverFile(`steady-${ym}.png`, 'image/png', blob);
    if (how === 'downloaded') toast('Picture saved');
  },
};
