import { S, save } from './store.js';
import { esc, render as rerender } from './core.js';
import { PLAN } from '../data/seed.js';
import { todayISO, dinnerFor, prepState, addDays, fmtDate } from './logic.js';

let open = null; // which section is expanded

export function enter() {
  if (new Date().getDay() === 0) open = 'prep';
}

const section = (id, title, body, sub = '') => `
  <section class="card acc">
    <button class="acc-head" data-act="open" data-id="${id}" aria-expanded="${open === id}">
      <span><strong>${title}</strong>${sub ? `<br><span class="muted">${sub}</span>` : ''}</span><span class="chev ${open === id ? 'down' : ''}">›</span>
    </button>
    ${open === id ? `<div class="acc-body">${body}</div>` : ''}
  </section>`;

export function render() {
  const d = todayISO();
  const prep = prepState(S, d);
  const prepCount = PLAN.sundayPrep.filter((_, i) => prep.checks[i]).length;

  const dinners = `<ul class="plain">${Array.from({ length: 7 }, (_, i) => {
    const day = addDays(d, i);
    return `<li><span class="muted">${i === 0 ? 'Tonight' : esc(fmtDate(day, { weekday: 'short' }))}</span><span class="grow">${esc(dinnerFor(day))}</span></li>`;
  }).join('')}</ul>`;

  const prepList = PLAN.sundayPrep.map((label, i) => `
    <button class="row ${prep.checks[i] ? 'done' : ''}" data-act="prep" data-i="${i}" aria-pressed="${!!prep.checks[i]}">
      <span class="box" aria-hidden="true"></span><span class="row-text"><span class="lbl">${esc(label)}</span></span>
    </button>`).join('') + '<p class="hint">Resets every Sunday. Do what you can; some is plenty.</p>';

  const rules = `<ul class="bullets">${PLAN.psylliumRules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`;
  const pairs = (rows) => `<ul class="plain">${rows.map(([a, b]) => `<li><span class="grow">${esc(a)}</span><span class="muted">${esc(b)}</span></li>`).join('')}</ul>`;

  return `
    <header class="head"><div><p class="eyebrow">Reference</p><h1>Plan</h1></div></header>
    ${section('dinner', 'Dinner rotation', dinners, `Tonight: ${esc(dinnerFor(d))}`)}
    ${section('prep', 'Sunday prep', prepList, `${prepCount} of ${PLAN.sundayPrep.length} done this week`)}
    ${section('psyllium', 'Psyllium rules', rules)}
    ${section('protein', 'Protein cheat sheet', pairs(PLAN.protein) + '<p class="hint">Rough figures per serving.</p>')}
    ${section('targets', 'Daily targets', pairs(PLAN.targets))}`;
}

export const actions = {
  open(el) { open = open === el.dataset.id ? null : el.dataset.id; rerender(); },
  prep(el) {
    const p = prepState(S, todayISO());
    const i = el.dataset.i;
    if (p.checks[i]) delete p.checks[i]; else p.checks[i] = true;
    save(); rerender();
  },
};
