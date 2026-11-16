import { S } from './store.js';
import { esc, commit, go } from './core.js';
import { todayISO, dayType, checklistFor, getDay, streak, motivation, fmtDate, weighInDue, planFor } from './logic.js';
import { startWorkout } from './ui-workout.js';

const GLASSES = 12;

export function quoteHTML(m) {
  if (!m) return '';
  return `<figure class="quote"><blockquote>${esc(m.text)}</blockquote>${m.ref ? `<figcaption>${esc(m.ref)} (WEB)</figcaption>` : ''}</figure>`;
}

export function render() {
  const d = todayISO();
  const type = dayType(S, d);
  const day = S.days[d] || { checks: {}, water: 0 };
  const items = checklistFor(S, d);
  const st = streak(S, d);
  const required = items.filter((i) => !i.optional);
  const allDone = required.length > 0 && required.every((i) => i.done);
  const plan = planFor(S, d);

  const toggle = type === 'weekend'
    ? `<span class="pill">Weekend</span>`
    : `<div class="seg" role="group" aria-label="Day type">
        <button data-act="type" data-type="office" aria-pressed="${type === 'office'}">Office</button>
        <button data-act="type" data-type="home" aria-pressed="${type === 'home'}">Home</button>
      </div>`;

  const streakText = st.count === 0 ? 'Day one starts whenever you are ready'
    : st.count === 1 ? '1 day and counting' : `${st.count}-day streak`;

  const rows = items.map((it) => `
    <button class="row ${it.done ? 'done' : ''}" data-act="tick" data-id="${esc(it.id)}" aria-pressed="${it.done}">
      <span class="box" aria-hidden="true"></span>
      <span class="row-text"><span class="time">${esc(it.time || '')}</span><span class="lbl">${esc(it.label)}</span></span>
      ${it.link ? '<span class="chev" aria-hidden="true">›</span>' : ''}
    </button>`).join('');

  const water = day.water || 0;
  const drops = Array.from({ length: GLASSES }, (_, i) =>
    `<button class="drop ${i < water ? 'full' : ''}" data-act="water" data-i="${i}" aria-label="Glass ${i + 1}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3.5 4.6 6 7.7 6 11a6 6 0 0 1-12 0c0-3.300 2.500-6.400 6-11z"/></svg>
    </button>`).join('');

  return `
    <header class="head">
      <div>
        <p class="eyebrow">${esc(fmtDate(d, { weekday: 'long' }))}</p>
        <h1>${esc(fmtDate(d, { day: 'numeric', month: 'long' }))}</h1>
      </div>
      ${toggle}
    </header>

    ${quoteHTML(motivation(S, d, 0))}

    <p class="streak"><span class="dot"></span>${esc(streakText)}</p>
    ${st.nudge ? `<p class="nudge">Yesterday was a quiet one, and that is fine. Something small today keeps things moving.</p>` : ''}
    ${weighInDue(S, d) ? `<button class="card link-card" data-act="tab" data-tab="progress"><span>Weigh-in morning. Just one number.</span><span class="chev">›</span></button>` : ''}
    ${allDone ? `<div class="card celebrate"><span class="spark" aria-hidden="true">✓</span><div><strong>Everything is ticked.</strong><br>A good day, quietly done.</div></div>` : ''}

    <section class="card list">${rows}</section>
    ${plan.rest && type === 'weekend' ? '<p class="hint">Rest day. A walk still counts if you fancy one.</p>' : ''}

    <section class="card">
      <div class="card-head"><h2>Water</h2><span class="muted">${(water * 0.25).toFixed(2).replace(/\.?0+$/, '')} of 3 L</span></div>
      <div class="drops">${drops}</div>
    </section>`;
}

export const actions = {
  type(el) {
    getDay(S, todayISO()).type = el.dataset.type;
    commit();
  },
  tick(el) {
    const d = todayISO();
    const items = checklistFor(S, d);
    const it = items.find((i) => i.id === el.dataset.id);
    if (!it) return;
    if (it.link === 'workout') { startWorkout(it.workoutId); return go('workout'); }
    if (it.link === 'plan') return go('plan');
    const day = getDay(S, d);
    if (day.checks[it.id]) delete day.checks[it.id]; else day.checks[it.id] = true;
    day.walk = items.some((i) => i.kind === 'walk' && day.checks[i.id]);
    commit();
  },
  water(el) {
    const i = Number(el.dataset.i);
    const day = getDay(S, todayISO());
    day.water = day.water === i + 1 ? i : i + 1;
    commit();
  },
};
