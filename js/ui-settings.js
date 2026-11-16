import { S, save, exportJSON, importJSON, reloadSeed } from './store.js';
import { esc, render as rerender, commit, toast, deliverFile } from './core.js';
import { DAY_NAMES, todayISO, daysBetween, SIZES, SIZE_LABEL } from './logic.js';
import { reminderList, buildICS } from './ics.js';

let page = 'main';        // main | checklist | plan | workouts | workout | reminders
let listKey = 'home';     // which checklist is being edited
let wid = null;           // which workout is being edited
const skipped = new Set(); // reminders unticked before export

export function enter() { page = 'main'; }

const back = (title, to = 'main') => `
  <header class="head sub"><button class="btn ghost small" data-act="page" data-page="${to}">‹ Back</button><h1>${title}</h1></header>`;

const uid = (p) => `${p}-${Date.now().toString(36)}`;

// ── pages ────────────────────────────────────────────────────────────────────
function main() {
  const c = S.config;
  const days = [1, 2, 3, 4, 5].map((d) =>
    `<button class="chip day" data-act="office" data-d="${d}" aria-pressed="${c.officeDays.includes(d)}">${DAY_NAMES[d].slice(0, 3)}</button>`).join('');
  const last = S.meta.lastExport;
  const ago = last ? daysBetween(last, todayISO()) : null;
  const backup = last == null ? 'No backup yet' : ago === 0 ? 'Last backup: today' : `Last backup: ${ago} ${ago === 1 ? 'day' : 'days'} ago`;
  const nav = (p, label) => `<button class="row nav" data-act="page" data-page="${p}"><span class="row-text"><span class="lbl">${label}</span></span><span class="chev">›</span></button>`;

  return `
    <header class="head"><div><p class="eyebrow">Make it yours</p><h1>Settings</h1></div></header>

    <section class="card">
      <h2>Usual office days</h2>
      <p class="muted">Only a starting guess. Switch any day with one tap on Today.</p>
      <div class="chips">${days}</div>
    </section>

    <section class="card fields">
      <h2>Weight</h2>
      <label class="opt">Weigh-in day
        <select data-chg="weighDay">${DAY_NAMES.map((n, i) => `<option value="${i}" ${i === c.weighInDay ? 'selected' : ''}>${n}</option>`).join('')}</select>
      </label>
      <label class="opt">Target weight (kg)
        <input type="number" inputmode="decimal" step="0.5" data-chg="targetKg" value="${esc(c.target.weightKg)}">
      </label>
      <label class="opt">Target date
        <input type="date" data-chg="targetDate" value="${esc(c.target.date)}">
      </label>
    </section>

    <section class="card list">
      ${nav('checklist', 'Edit checklists')}
      ${nav('plan', 'Edit weekly workout plan')}
      ${nav('workouts', 'Edit workouts and exercises')}
      ${nav('reminders', 'Reminders')}
    </section>

    <section class="card">
      <h2>Motivation</h2>
      <label class="switch"><input type="checkbox" data-chg="mot" data-key="quotes" ${c.motivation.quotes ? 'checked' : ''}><span>Encouraging lines</span></label>
      <label class="switch"><input type="checkbox" data-chg="mot" data-key="verses" ${c.motivation.verses ? 'checked' : ''}><span>Scripture verses</span></label>
    </section>

    <section class="card">
      <h2>Your data</h2>
      <p class="muted">Everything stays on this phone. ${backup}.</p>
      <div class="btn-row">
        <button class="btn soft" data-act="export">Export</button>
        <label class="btn soft">Import<input type="file" accept="application/json,.json" data-chg="import" hidden></label>
      </div>
      <button class="btn ghost small" data-act="reseed">Reload plan from seed file</button>
    </section>`;
}

function checklist() {
  const items = S.config.checklists[listKey];
  const tabs = ['home', 'office', 'weekend'].map((k) =>
    `<button data-act="list" data-k="${k}" aria-pressed="${k === listKey}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('');
  const rows = items.map((it, i) => `
    <div class="edit-row">
      <div class="edit-inputs">
        <input class="t" data-chg="item" data-i="${i}" data-f="time" value="${esc(it.time || '')}" aria-label="Time" placeholder="Time">
        <input data-chg="item" data-i="${i}" data-f="label" value="${esc(it.label)}" aria-label="Item">
      </div>
      <div class="edit-btns">
        <button class="x" data-act="move" data-i="${i}" data-by="-1" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="x" data-act="move" data-i="${i}" data-by="1" aria-label="Move down" ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="x" data-act="delItem" data-i="${i}" aria-label="Remove">×</button>
      </div>
      ${it.kind ? `<p class="hint tight">${{ walk: 'Counts as the day’s activity', workout: 'Shows today’s workout', dinner: 'Shows tonight’s dish', prep: 'Opens Sunday prep' }[it.kind]}</p>` : ''}
    </div>`).join('');
  return `${back('Checklists')}
    <div class="seg wide">${tabs}</div>
    <section class="card">${rows}<button class="btn soft" data-act="addItem">Add item</button></section>`;
}

function plan() {
  const opts = (sel) => `<option value="">Rest</option>` + S.config.workouts.map((w) =>
    `<option value="${esc(w.id)}" ${w.id === sel ? 'selected' : ''}>${esc(w.name)}</option>`).join('');
  const rows = [1, 2, 3, 4, 5, 6, 0].map((d) => `
    <label class="opt">${DAY_NAMES[d]}
      <select data-chg="planDay" data-d="${d}">${opts(S.config.weeklyPlan[d]?.workout)}</select>
    </label>`).join('');
  return `${back('Weekly plan')}
    <p class="muted pad">This is the plan for days you are not at the office. An office day is always a walk, with one kettlebell round as an optional bonus.</p>
    <section class="card fields">${rows}</section>`;
}

function workouts() {
  const rows = S.config.workouts.map((w) => `
    <button class="row nav" data-act="editW" data-id="${esc(w.id)}"><span class="row-text"><span class="lbl">${esc(w.name)}</span><span class="cue">${w.exercises.length} ${w.exercises.length === 1 ? 'item' : 'items'}</span></span><span class="chev">›</span></button>`).join('');
  return `${back('Workouts')}
    <section class="card list">${rows}</section>
    <button class="btn soft" data-act="addW">Add workout</button>`;
}

function workout() {
  const w = S.config.workouts.find((x) => x.id === wid);
  if (!w) { page = 'workouts'; return workouts(); }
  const sizes = SIZES.map((s) => `
    <label class="opt">${SIZE_LABEL[s]}
      <input data-chg="wSize" data-s="${s}" value="${esc(w.sizes?.[s] || '')}">
    </label>`).join('');
  const rows = w.exercises.map((x, i) => `
    <div class="edit-row">
      <div class="edit-inputs col">
        <input data-chg="ex" data-i="${i}" data-f="name" value="${esc(x.name)}" aria-label="Exercise">
        <input data-chg="ex" data-i="${i}" data-f="cue" value="${esc(x.cue || '')}" aria-label="Form cue" placeholder="One-line form cue">
      </div>
      <div class="edit-btns">
        <button class="x" data-act="moveEx" data-i="${i}" data-by="-1" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="x" data-act="moveEx" data-i="${i}" data-by="1" aria-label="Move down" ${i === w.exercises.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="x" data-act="delEx" data-i="${i}" aria-label="Remove">×</button>
      </div>
      <label class="switch tight"><input type="checkbox" data-chg="exTrack" data-i="${i}" ${x.track === 'weight' ? 'checked' : ''}><span>Optional weight box</span></label>
    </div>`).join('');
  return `${back('Edit workout', 'workouts')}
    <section class="card fields">
      <label class="opt">Name<input data-chg="wField" data-f="name" value="${esc(w.name)}"></label>
      <label class="opt">Note<input data-chg="wField" data-f="note" value="${esc(w.note || '')}"></label>
      <label class="switch"><input type="checkbox" data-chg="wRounds" ${w.rounds ? 'checked' : ''}><span>Show a round counter</span></label>
    </section>
    <section class="card fields"><h2>Sizes</h2>${sizes}</section>
    <section class="card"><h2>Exercises</h2>${rows}<button class="btn soft" data-act="addEx">Add exercise</button></section>
    ${['walk'].includes(w.id) ? '' : '<button class="btn ghost small" data-act="delW">Remove this workout</button>'}`;
}

function reminders() {
  const list = reminderList(S);
  const rows = list.map((r) => `
    <label class="switch remind"><input type="checkbox" data-chg="remind" data-id="${esc(r.id)}" ${skipped.has(r.id) ? '' : 'checked'}>
      <span><strong>${esc(r.title)}</strong><br><span class="muted">${esc(r.when)}</span></span></label>`).join('');
  return `${back('Reminders')}
    <p class="muted pad">These go into your iPhone Calendar as repeating events with alerts. No notifications come from this app itself.</p>
    <section class="card">${rows}</section>
    <button class="btn primary big-btn" data-act="ics">Add reminders to my calendar</button>
    <section class="card">
      <h2>How it works</h2>
      <ol class="steps">
        <li>Tap the button, then choose <strong>Calendar</strong> in the share sheet.</li>
        <li>Tap <strong>Add All</strong> and pick a calendar.</li>
        <li>To change or stop one later, edit it in the Calendar app and choose “All Future Events”.</li>
      </ol>
      <h2>If the button does not work</h2>
      <p class="muted">Open the Reminders app, tap New Reminder, type the title, then tap ⓘ → Date and Time → Repeat, using the titles and times listed above.</p>
    </section>`;
}

export function render() {
  return { main, checklist, plan, workouts, workout, reminders }[page]();
}

// ── actions ──────────────────────────────────────────────────────────────────
const W = () => S.config.workouts.find((x) => x.id === wid);
const swap = (arr, i, by) => { const j = i + by; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };
const redo = () => { save(); rerender(); };

export const actions = {
  page(el) { page = el.dataset.page; rerender(); window.scrollTo(0, 0); },
  office(el) {
    const d = Number(el.dataset.d), a = S.config.officeDays;
    S.config.officeDays = a.includes(d) ? a.filter((x) => x !== d) : [...a, d].sort();
    redo();
  },
  list(el) { listKey = el.dataset.k; rerender(); },
  move(el) { swap(S.config.checklists[listKey], Number(el.dataset.i), Number(el.dataset.by)); redo(); },
  delItem(el) {
    const items = S.config.checklists[listKey];
    if (confirm(`Remove “${items[el.dataset.i].label}”?`)) { items.splice(el.dataset.i, 1); redo(); }
  },
  addItem() { S.config.checklists[listKey].push({ id: uid('item'), time: '', label: 'New item' }); redo(); },
  editW(el) { wid = el.dataset.id; page = 'workout'; rerender(); window.scrollTo(0, 0); },
  addW() {
    const w = { id: uid('w'), name: 'New workout', kind: 'strength', note: '', sizes: { quick: '5–10 minutes', standard: '15–20 minutes', full: '30+ minutes' }, exercises: [] };
    S.config.workouts.push(w); wid = w.id; page = 'workout'; redo();
  },
  delW() {
    const w = W();
    if (!confirm(`Remove “${w.name}”? Past sessions stay in your history.`)) return;
    S.config.workouts = S.config.workouts.filter((x) => x.id !== wid);
    S.config.weeklyPlan.forEach((p) => { if (p.workout === wid) { p.workout = null; p.rest = true; } });
    page = 'workouts'; redo();
  },
  addEx() { W().exercises.push({ id: uid('ex'), name: 'New exercise', cue: '' }); redo(); },
  delEx(el) { W().exercises.splice(el.dataset.i, 1); redo(); },
  moveEx(el) { swap(W().exercises, Number(el.dataset.i), Number(el.dataset.by)); redo(); },
  async ics() {
    const list = reminderList(S).filter((r) => !skipped.has(r.id));
    if (!list.length) return toast('Pick at least one reminder');
    const how = await deliverFile('steady-reminders.ics', 'text/calendar', buildICS(list));
    if (how === 'downloaded') toast('Calendar file saved. Open it to add the events.');
  },
  async export() {
    const how = await deliverFile(`steady-backup-${todayISO()}.json`, 'application/json', exportJSON());
    if (how !== 'cancelled') { S.meta.lastExport = todayISO(); redo(); }
  },
  reseed() {
    if (confirm('Replace your settings (checklists, plan, workouts) with the seed file? Logged days, workouts and weigh-ins are kept.')) {
      reloadSeed(); rerender(); toast('Plan reloaded');
    }
  },
};

export const changes = {
  weighDay(el) { S.config.weighInDay = Number(el.value); save(); },
  targetKg(el) { const v = parseFloat(el.value); if (v > 0) { S.config.target.weightKg = v; save(); } },
  targetDate(el) { if (el.value) { S.config.target.date = el.value; save(); } },
  mot(el) { S.config.motivation[el.dataset.key] = el.checked; save(); },
  item(el) { S.config.checklists[listKey][el.dataset.i][el.dataset.f] = el.value.trim(); save(); },
  planDay(el) {
    S.config.weeklyPlan[el.dataset.d] = el.value ? { workout: el.value } : { workout: null, rest: true };
    save();
  },
  wField(el) { W()[el.dataset.f] = el.value.trim(); save(); },
  wRounds(el) { W().rounds = el.checked; save(); },
  wSize(el) { (W().sizes ||= {})[el.dataset.s] = el.value.trim(); save(); },
  ex(el) { W().exercises[el.dataset.i][el.dataset.f] = el.value.trim(); save(); },
  exTrack(el) { const x = W().exercises[el.dataset.i]; if (el.checked) x.track = 'weight'; else delete x.track; save(); },
  remind(el) { if (el.checked) skipped.delete(el.dataset.id); else skipped.add(el.dataset.id); },
  async import(el) {
    const file = el.files[0];
    if (!file) return;
    if (!confirm('Replace everything on this phone with the data in this file?')) { el.value = ''; return; }
    const err = importJSON(await file.text());
    if (err) return toast(err);
    commit({ quiet: true });
    toast('Data imported');
  },
};
