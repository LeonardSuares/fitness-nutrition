import { S } from './store.js';
import { esc, commit, go, toast } from './core.js';
import {
  todayISO, addDays, dayType, checklistFor, getDay, motivation, fmtDate, weighInDue, savingsTarget,
  coreFor, mealName, waterGlasses, dinnerFor, showedUpThisMonth, timeText,
  showedUp, gapBefore, RISE_GAP, inPlanYear, quarterOf, daysBetween,
} from './logic.js';
import { openOn } from './ui-settings.js';
import { openOn as openProgress } from './ui-progress.js';
import * as SC from './score.js';
import { startWorkout } from './ui-workout.js';
import { season, saintFor, readingPace, paceBook } from './faith.js';
import { BOOKS, NT_START } from '../data/faith.js';
import { overlay, closeOverlay } from './core.js';

let extrasOpen = false;
let saintOpen = false;

export function quoteHTML(m) {
  if (!m) return '';
  return `<figure class="quote"><blockquote>${esc(m.text)}</blockquote>${m.ref ? `<figcaption>${esc(m.ref)} (RSV-2CE)</figcaption>` : ''}</figure>`;
}

function saintHTML(d) {
  if (S.config.motivation?.saint === false) return '';
  const s = saintFor(d);
  const month = fmtDate(d, { month: 'long' });
  return `
    <button class="saint" data-act="saint" aria-expanded="${saintOpen}">
      <span class="who">${esc(s.name)}</span> · saint for ${esc(month)}${s.feast ? `, feast ${esc(s.feast)}` : ''} <span class="chev ${saintOpen ? 'down' : ''}" aria-hidden="true">›</span>
      ${saintOpen ? (s.quote
        ? `<span class="saint-quote">${esc(s.quote)}<cite>${esc(s.source)}</cite></span>`
        : `<span class="saint-quote">${esc(s.about || '')}</span>`) : ''}
    </button>`;
}

// "Where I am" in the year's Bible reading.
function pickerHTML(d) {
  const cur = S.scripture?.book;
  const opt = (i) => `<option value="${i}" ${i === cur ? 'selected' : ''}>${esc(BOOKS[i][0])}</option>`;
  const idx = BOOKS.map((_, i) => i);
  const g = S.config.goals.scripture;
  const before = d < g.start;
  return `
    <div class="picker">
      <h2>Where I am</h2>
      <p class="muted">${esc(g.title)}, ${esc(fmtDate(g.start, { day: 'numeric', month: 'short' }))} to ${esc(fmtDate(g.end, { day: 'numeric', month: 'short', year: 'numeric' }))}.</p>
      <select id="book" aria-label="Book you are reading">
        <option value="">Choose a book</option>
        <optgroup label="Old Testament">${idx.slice(0, NT_START).map(opt).join('')}</optgroup>
        <optgroup label="New Testament">${idx.slice(NT_START).map(opt).join('')}</optgroup>
      </select>
      <p class="pace-note">${before ? 'The reading plan starts on ' + esc(fmtDate(g.start, { day: 'numeric', month: 'long' })) + '.' : `On the plan's pace, today is around ${esc(BOOKS[paceBook(S, d)][0])}. A rough guide only.`}</p>
      <button class="btn primary big-btn" data-act="saveBook">Save</button>
      <button class="btn ghost" data-act="closeOverlay">Cancel</button>
    </div>`;
}

const litres = (glasses) => (glasses * 0.25).toFixed(2).replace(/\.?0+$/, '');
const MEAL_STATE = ['Tap when eaten', 'Eaten · protein?', 'With protein'];

const box = '<span class="box" aria-hidden="true"></span>';
const text = (it) => `<span class="row-text">${it.time ? `<span class="time">${esc(it.time)}</span>` : ''}<span class="lbl">${esc(it.label)}</span>${it.cue ? `<span class="cue">${esc(it.cue)}</span>` : ''}</span>`;

function coreRow(it, d, day) {
  if (it.id === 'scripture') {
    const pace = readingPace(S, d);
    return `
      <div class="core-item row-wrap">
        <button class="row ${it.done ? 'done' : ''}" data-act="core" data-id="scripture" aria-pressed="${it.done}">${box}${text({ ...it, cue: pace ? pace.text : it.cue })}</button>
        <button class="go" data-act="picker" aria-label="Where I am in the reading">›</button>
      </div>`;
  }
  if (it.id === 'workout') {
    return `
      <div class="core-item row-wrap">
        <button class="row ${it.done ? 'done' : ''}" data-act="core" data-id="workout" aria-pressed="${it.done}">${box}${text(it)}</button>
        <button class="go" data-act="openWorkout" aria-label="Open the workout">›</button>
      </div>`;
  }
  if (it.id === 'meals') {
    const tiles = it.meals.map((m, i) => `
      <button class="meal s${m}" data-act="meal" data-i="${i}" aria-label="${esc(mealName(i))}: ${MEAL_STATE[m]}">
        <span class="m-name">${esc(mealName(i))}</span><span class="m-state">${MEAL_STATE[m]}</span>
      </button>`).join('');
    const protein = it.meals.filter((m) => m === 2).length;
    return `
      <div class="core-item">
        <div class="row ${it.done ? 'done' : ''}">${box}${text({ ...it, cue: `Tonight: ${dinnerFor(d)}` })}</div>
        <div class="meals">${tiles}</div>
        <p class="meal-hint">${protein ? `${protein} of ${it.meals.length} with protein.` : 'Tap once for the meal, again if it had protein.'}</p>
      </div>`;
  }
  if (it.id === 'water') {
    const w = day.water || 0, goal = waterGlasses(S);
    const drops = Array.from({ length: Math.max(goal, w) }, (_, i) =>
      `<button class="drop ${i < w ? 'full' : ''}" data-act="water" data-i="${i}" aria-label="Glass ${i + 1}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3.5 4.6 6 7.7 6 11a6 6 0 0 1-12 0c0-3.300 2.500-6.400 6-11z"/></svg>
      </button>`).join('');
    return `
      <div class="core-item">
        <div class="row ${it.done ? 'done' : ''}">${box}${text({ ...it, cue: `${litres(w)} of ${litres(goal)} L` })}</div>
        <div class="drops">${drops}</div>
      </div>`;
  }
  return `<button class="core-item row ${it.done ? 'done' : ''}" data-act="core" data-id="${it.id}" aria-pressed="${it.done}">${box}${text(it)}</button>`;
}

// Cards that come and go with the calendar: a comeback, a new quarter, the
// monthly savings number, the March review and the stretch-goal decision.
function planCards(d) {
  const out = [];
  const y = d.slice(0, 4), q = quarterOf(d);
  const g = S.config.goals, f = g.finance, st = f.stretch;

  const gap = showedUp(S, d) ? 0 : gapBefore(S, d);
  if (gap >= RISE_GAP) {
    out.push(`<div class="card celebrate"><span class="spark" aria-hidden="true">↑</span><div><strong>Welcome back.</strong><br>The last ${gap} days are forgiven, not counted. One tap today and you rise again.</div></div>`);
  }

  const key = `${y}-Q${q}`;
  if (inPlanYear(S, d) && daysBetween(SC.quarterStart(y, q), d) < 7 && S.meta.freshSeen !== key) {
    out.push(`
      <section class="card ask">
        <p class="eyebrow">Q${q} · ${esc(g.themes[q - 1])}</p>
        <p><strong>A fresh start.</strong> ${q === 1 ? `${esc(y)} begins. This first quarter is gentle on purpose.` : `Q${q - 1} is closed, whatever it held. This quarter starts clean.`}</p>
        <div class="btn-row">
          ${q > 1 ? `<button class="btn ghost" data-act="seeQuarter" data-k="${y}-Q${q - 1}">See Q${q - 1}</button>` : ''}
          <button class="btn soft" data-act="freshSeen" data-k="${key}">Begin</button>
        </div>
      </section>`);
  }

  const prev = SC.addMonths(SC.ymOf(d), -1);
  if (Number(d.slice(8)) <= 7 && S.meta.startDate && prev >= SC.ymOf(S.meta.startDate) && S.savings[prev] == null) {
    out.push(`<button class="card link-card" data-act="saveMonth" data-ym="${prev}"><span>How much did you save in ${esc(SC.monthLabel(prev, { month: 'long' }))}? One number.</span><span class="chev">›</span></button>`);
  }

  if (f.reviewDate && d >= f.reviewDate && d <= addDays(f.reviewDate, 6) && S.meta.reviewed !== f.reviewDate) {
    const months = Array.from({ length: 12 }, (_, i) => `${f.reviewDate.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`);
    out.push(`
      <section class="card ask">
        <p><strong>Savings check-in.</strong> Is ${esc(SC.money(S, savingsTarget(S)))} still the right target for the year? Saved so far: ${esc(SC.money(S, SC.saved(S, months)))}.</p>
        <div class="btn-row">
          <button class="btn ghost" data-act="goals">Change target</button>
          <button class="btn soft" data-act="reviewed">Looks right</button>
        </div>
      </section>`);
  }

  if (st.name && !st.decision && st.decideBy && d >= addDays(st.decideBy, -27) && S.meta.stretchLater !== d) {
    out.push(`
      <section class="card ask">
        <p><strong>${esc(st.name)}: go or no-go?</strong><br><span class="muted">${d > st.decideBy ? 'The date has passed. Whenever you are ready.' : `Decide by ${esc(fmtDate(st.decideBy, { day: 'numeric', month: 'long' }))}.`}</span></p>
        <div class="btn-row">
          <button class="btn soft" data-act="stretch" data-v="go">Go</button>
          <button class="btn soft" data-act="stretch" data-v="no">Not this year</button>
        </div>
        <button class="btn ghost small" data-act="stretch" data-v="later">Ask me later</button>
      </section>`);
  }
  return out.join('');
}

export function render() {
  const d = todayISO();
  const type = dayType(S, d);
  const day = S.days[d] || { checks: {}, water: 0 };
  const core = coreFor(S, d);
  const allDone = core.every((i) => i.done);
  const extras = checklistFor(S, d);
  const y = addDays(d, -1);
  const askLights = S.meta.startDate && y >= S.meta.startDate && S.days[y]?.checks?.lights == null;
  const shown = showedUpThisMonth(S, d);
  const month = fmtDate(d, { month: 'long' });
  const cards = planCards(d);

  const toggle = type === 'weekend'
    ? `<span class="pill">Weekend</span>`
    : `<div class="seg" role="group" aria-label="Day type">
        <button data-act="type" data-type="office" aria-pressed="${type === 'office'}">Office</button>
        <button data-act="type" data-type="home" aria-pressed="${type === 'home'}">Home</button>
      </div>`;

  const extraRows = extras.map((it) => `
    <button class="row ${it.done ? 'done' : ''}" data-act="tick" data-id="${esc(it.id)}" aria-pressed="${it.done}">
      ${box}<span class="row-text"><span class="time">${esc(it.time || '')}</span><span class="lbl">${esc(it.label)}</span></span>
      ${it.link ? '<span class="chev" aria-hidden="true">›</span>' : ''}
    </button>`).join('');
  const extrasDone = extras.filter((i) => i.done).length;

  return `
    <header class="head">
      <div>
        <p class="eyebrow">${esc(fmtDate(d, { weekday: 'long' }))} · ${esc(season(d).name)}</p>
        <h1>${esc(fmtDate(d, { day: 'numeric', month: 'long' }))}</h1>
      </div>
      ${toggle}
    </header>

    ${quoteHTML(motivation(S, d, 0))}
    ${saintHTML(d)}

    <p class="streak"><span class="dot"></span>${shown ? `Showed up ${shown} ${shown === 1 ? 'day' : 'days'} in ${esc(month)}` : 'Any tap today counts'}</p>
    ${cards}
    ${savingsTarget(S) ? '' : `<button class="card link-card" data-act="goals"><span>Your ${esc(S.config.goals.year)} plan is in. Add your savings targets.</span><span class="chev">›</span></button>`}
    ${weighInDue(S, d) ? `<button class="card link-card" data-act="tab" data-tab="progress"><span>Weigh-in morning. Just one number.</span><span class="chev">›</span></button>` : ''}
    ${askLights ? `
      <section class="card ask">
        <p><strong>Lights out by ${esc(timeText(S.config.goals.rhythm.lightsOut))} last night?</strong></p>
        <div class="btn-row">
          <button class="btn soft" data-act="lastNight" data-v="1">Yes</button>
          <button class="btn ghost" data-act="lastNight" data-v="0">Not last night</button>
        </div>
      </section>` : ''}
    ${allDone ? `<div class="card celebrate"><span class="spark" aria-hidden="true">✓</span><div><strong>All six, done.</strong><br>A good day, quietly kept.</div></div>` : ''}

    <section class="card list">${core.map((it) => coreRow(it, d, day)).join('')}</section>

    ${extras.length ? `
    <section class="card acc">
      <button class="acc-head" data-act="extras" aria-expanded="${extrasOpen}">
        <span><strong>Extras</strong><br><span class="muted">${extrasDone ? `${extrasDone} of ${extras.length} done` : 'Optional'}</span></span>
        <span class="chev ${extrasOpen ? 'down' : ''}">›</span>
      </button>
      ${extrasOpen ? `<div class="acc-body">${extraRows}</div>` : ''}
    </section>` : ''}`;
}

export const actions = {
  goals() { openOn('goals'); go('settings'); },
  saint() { saintOpen = !saintOpen; commit({ quiet: true }); },
  picker() { overlay(pickerHTML(todayISO())); },
  saveBook() {
    const v = document.getElementById('book').value;
    if (v === '') delete S.scripture; else S.scripture = { book: Number(v), date: todayISO() };
    closeOverlay();
    commit({ quiet: true });
  },
  saveMonth(el) { openProgress('month', el.dataset.ym); go('progress'); },
  seeQuarter(el) { openProgress('quarter', el.dataset.k); go('progress'); },
  freshSeen(el) { S.meta.freshSeen = el.dataset.k; commit({ quiet: true }); },
  reviewed() { S.meta.reviewed = S.config.goals.finance.reviewDate; commit({ quiet: true }); },
  stretch(el) {
    const v = el.dataset.v;
    if (v === 'later') S.meta.stretchLater = todayISO();
    else S.config.goals.finance.stretch.decision = v;
    commit({ quiet: true });
  },
  type(el) {
    getDay(S, todayISO()).type = el.dataset.type;
    commit();
  },
  core(el) {
    const d = todayISO();
    const day = getDay(S, d);
    const id = el.dataset.id;
    if (day.checks[id]) delete day.checks[id]; else day.checks[id] = true;
    commit();
    if (id === 'workout' && !day.checks.workout && coreFor(S, d)[0].done) toast('Still counted: a session or walk is logged today');
  },
  openWorkout() {
    startWorkout(coreFor(S, todayISO())[0].workoutId);
    go('workout');
  },
  meal(el) {
    const day = getDay(S, todayISO());
    const i = Number(el.dataset.i);
    const meals = (day.meals ||= []);
    while (meals.length <= i) meals.push(0);
    meals[i] = ((meals[i] || 0) + 1) % 3;
    commit();
  },
  water(el) {
    const i = Number(el.dataset.i);
    const day = getDay(S, todayISO());
    day.water = day.water === i + 1 ? i : i + 1;
    commit();
  },
  lastNight(el) {
    getDay(S, addDays(todayISO(), -1)).checks.lights = el.dataset.v === '1';
    commit();
  },
  extras() { extrasOpen = !extrasOpen; commit({ quiet: true }); },
  tick(el) {
    const d = todayISO();
    const items = checklistFor(S, d);
    const it = items.find((i) => i.id === el.dataset.id);
    if (!it) return;
    if (it.link === 'plan') return go('plan');
    const day = getDay(S, d);
    if (day.checks[it.id]) delete day.checks[it.id]; else day.checks[it.id] = true;
    day.walk = items.some((i) => i.kind === 'walk' && day.checks[i.id]);
    commit();
  },
};
