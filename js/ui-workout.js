import { S, save } from './store.js';
import { esc, commit, overlay, render as rerender } from './core.js';
import {
  todayISO, planFor, workoutById, getDay, checklistFor, defaultSize, shouldSuggest, lastEntry,
  motivation, addDays, fmtDate, SIZES, SIZE_LABEL,
} from './logic.js';

const FIELD = {
  minutes: { label: 'Minutes', step: '1' },
  distance: { label: 'Distance (km)', step: '0.1' },
  steps: { label: 'Steps', step: '100' },
};

function newDraft(workoutId) {
  const d = todayISO();
  return { date: d, workoutId, size: workoutId ? defaultSize(S, workoutId, d) : 'quick', ticks: {}, rounds: 0, entries: {} };
}

// Make sure there is a draft for today; start from the planned workout.
function draft() {
  const d = todayISO();
  if (!S.draft || S.draft.date !== d || (S.draft.workoutId && !workoutById(S, S.draft.workoutId))) {
    S.draft = newDraft(planFor(S, d).workout?.id || null);
  }
  return S.draft;
}

export function startWorkout(workoutId) {
  const dr = draft();
  if (workoutId && dr.workoutId !== workoutId) S.draft = newDraft(workoutId);
  save();
}

export function render() {
  const d = todayISO();
  const dr = draft();
  const plan = planFor(S, d);
  const w = workoutById(S, dr.workoutId);
  const doneToday = S.sessions.filter((s) => s.date === d);

  const chips = S.config.workouts.map((x) =>
    `<button class="chip" data-act="pick" data-id="${esc(x.id)}" aria-pressed="${x.id === dr.workoutId}">${esc(x.name)}</button>`).join('');

  const planLine = plan.office
    ? `Office day: a walk is the plan.${plan.bonus ? ` One round of ${esc(plan.bonus.name.toLowerCase())} is an optional bonus.` : ''}`
    : plan.workout ? `Planned today: ${esc(plan.workout.name)}.`
    : 'Rest day. Nothing planned, and that is part of the plan.';

  let body = '';
  if (w) {
    const exercises = w.exercises.filter((x) => !x.only || x.only.includes(dr.size));
    const sizeSeg = SIZES.map((s) =>
      `<button data-act="size" data-size="${s}" aria-pressed="${dr.size === s}">${SIZE_LABEL[s]}</button>`).join('');

    const rounds = w.rounds ? `
      <div class="rounds">
        <div><span class="muted">Rounds done</span><div class="big">${dr.rounds}</div></div>
        <div class="round-btns">
          ${dr.rounds > 0 ? '<button class="btn ghost small" data-act="roundBack" aria-label="Remove a round">−</button>' : ''}
          <button class="btn soft" data-act="round">Round done</button>
        </div>
      </div>` : '';

    const rows = exercises.map((x) => {
      const last = x.track ? lastEntry(S, x.id) : null;
      return `
      <div class="ex">
        <button class="row ${dr.ticks[x.id] ? 'done' : ''}" data-act="tick" data-id="${esc(x.id)}" aria-pressed="${!!dr.ticks[x.id]}">
          <span class="box" aria-hidden="true"></span>
          <span class="row-text"><span class="lbl">${esc(x.name)}</span><span class="cue">${esc(x.cue || '')}</span></span>
        </button>
        ${x.track === 'weight' ? `
        <label class="opt">Weight (lb), optional
          <input type="number" inputmode="decimal" step="2.5" min="0" data-chg="entry" data-key="${esc(x.id)}"
            value="${esc(dr.entries[x.id] ?? '')}" placeholder="${last != null ? `last time ${esc(last)}` : 'start light'}">
        </label>` : ''}
      </div>`;
    }).join('');

    const fields = (w.fields || []).map((f) => `
      <label class="opt">${FIELD[f].label}, optional
        <input type="number" inputmode="decimal" step="${FIELD[f].step}" min="0" data-chg="entry" data-key="${f}" value="${esc(dr.entries[f] ?? '')}">
      </label>`).join('');

    body = `
      <section class="card">
        <h2>${esc(w.name)}</h2>
        ${w.note ? `<p class="muted">${esc(w.note)}</p>` : ''}
        <div class="seg wide" role="group" aria-label="Workout size">${sizeSeg}</div>
        <p class="size-detail">${esc(w.sizes?.[dr.size] || '')}</p>
        ${rounds}
      </section>
      <section class="card list">${rows}</section>
      ${fields ? `<section class="card fields">${fields}</section>` : ''}
      <button class="btn primary big-btn" data-act="finish">Finish</button>
      <p class="hint">Any size counts. Showing up is the win.</p>`;
  }

  return `
    <header class="head"><div><p class="eyebrow">${esc(fmtDate(d, { weekday: 'long' }))}</p><h1>Workout</h1></div></header>
    <p class="plan-line">${planLine}</p>
    ${doneToday.length ? `<p class="done-line">✓ Done today: ${doneToday.map((s) => esc(workoutById(S, s.workoutId)?.name || 'Workout')).join(', ')}</p>` : ''}
    ${shouldSuggest(S, d) ? `
      <div class="card suggest">
        <p><strong>Two steady weeks.</strong> If it sounds good, try adding a round or choosing Standard today. Quick is still a full win.</p>
        <button class="btn ghost small" data-act="snooze">Not now</button>
      </div>` : ''}
    <div class="chips">${chips}</div>
    ${body}`;
}

function finishOverlay(w, fresh) {
  const m = motivation(S, todayISO(), 1);
  overlay(`
    <svg class="done-anim" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="34"/><path d="M25 41l10 10 20-22"/>
    </svg>
    <h2>${esc(w.name)} done</h2>
    ${m ? `<p class="overlay-quote">${esc(m.text)}${m.ref ? `<br><span class="muted">${esc(m.ref)} (WEB)</span>` : ''}</p>` : ''}
    ${fresh.map((b) => `<p class="badge-new">${b.icon} New badge: ${esc(b.name)}</p>`).join('')}
    <button class="btn primary big-btn" data-act="closeOverlay">Done</button>`);
}

export const actions = {
  pick(el) { S.draft = newDraft(el.dataset.id); save(); rerender(); },
  size(el) { draft().size = el.dataset.size; save(); rerender(); },
  tick(el) {
    const dr = draft();
    if (dr.ticks[el.dataset.id]) delete dr.ticks[el.dataset.id]; else dr.ticks[el.dataset.id] = true;
    save(); rerender();
  },
  round() { const dr = draft(); dr.rounds++; dr.ticks = {}; save(); rerender(); },
  roundBack() { const dr = draft(); dr.rounds = Math.max(0, dr.rounds - 1); save(); rerender(); },
  snooze() { S.meta.snoozeSuggestUntil = addDays(todayISO(), 14); save(); rerender(); },
  finish() {
    const d = todayISO();
    const dr = draft();
    const w = workoutById(S, dr.workoutId);
    if (!w) return;
    const entries = Object.fromEntries(Object.entries(dr.entries).filter(([, v]) => v !== '' && v != null));
    // If every exercise is ticked when finishing a circuit, that is a round too.
    const shown = w.exercises.filter((x) => !x.only || x.only.includes(dr.size));
    const rounds = w.rounds ? dr.rounds + (shown.every((x) => dr.ticks[x.id]) || dr.rounds === 0 ? 1 : 0) : 0;
    S.sessions.push({ date: d, workoutId: w.id, size: dr.size, rounds, entries });

    const day = getDay(S, d);
    for (const it of checklistFor(S, d)) {
      if (w.kind === 'walk' && it.kind === 'walk') { day.checks[it.id] = true; day.walk = true; }
      if (w.kind !== 'walk' && it.kind === 'workout') day.checks[it.id] = true;
    }
    S.draft = null;
    const fresh = commit({ quiet: true });
    finishOverlay(w, fresh);
  },
};

export const changes = {
  entry(el) { draft().entries[el.dataset.key] = el.value; save(); },
};
