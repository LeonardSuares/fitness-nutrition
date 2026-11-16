import { S, save } from './store.js';
import { esc, render as rerender, deliverFile, toast } from './core.js';
import { roadmap, roadmapImage } from './roadmap.js';
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

  const r = roadmap(S, d);
  const quarters = r.quarters.map((q) => `
    <li class="rq t-${q.tint || 'green'} ${q.now ? 'now' : ''}">
      <span class="node" aria-hidden="true">${q.q}</span>
      <div>
        <p class="rq-title"><strong>Q${q.q} · ${esc(q.theme)}</strong>${q.now ? ' <span class="here">You are here</span>' : ''}</p>
        <p class="rq-season">${esc(q.months)} · ${esc(q.seasons.join(' · '))}</p>
        <p class="rq-targets">${esc(q.targets.join(' · '))}</p>
      </div>
    </li>`).join('');

  return `
    <header class="head tight"><div><p class="eyebrow">${esc(r.year)} · ${esc(r.word)}</p><h1>Roadmap</h1></div></header>

    <section class="roadmap" aria-label="${esc(r.year)} roadmap">
      <figure class="quote rm-verse"><blockquote>“${esc(r.verse.text)}”</blockquote><figcaption>${esc(r.verse.ref)} (RSV-2CE)</figcaption></figure>
      <ol class="rpath">${quarters}</ol>
      <div class="card rgoals">
        ${r.goals.filter((g) => !g.pictureOnly).map((g) => `<div><span class="muted">${esc(g.label)}</span><span>${esc(g.value)}</span></div>`).join('')}
      </div>
      ${r.before ? `<p class="hint">It all starts on January 1. Until then, a warm-up.</p>` : ''}
      <button class="btn soft big-btn" data-act="roadmapPng">Save as a picture</button>
    </section>

    <h2 class="pad ref-head">Reference</h2>
    ${section('dinner', 'Dinner rotation', dinners, `Tonight: ${esc(dinnerFor(d))}`)}
    ${section('prep', 'Sunday prep', prepList, `${prepCount} of ${PLAN.sundayPrep.length} done this week`)}
    ${section('psyllium', 'Psyllium rules', rules)}
    ${section('protein', 'Protein cheat sheet', pairs(PLAN.protein) + '<p class="hint">Rough figures per serving.</p>')}
    ${section('targets', 'Daily targets', pairs(PLAN.targets))}`;
}

export const actions = {
  async roadmapPng() {
    const blob = await roadmapImage(S, todayISO());
    const how = await deliverFile(`steady-roadmap-${S.config.goals.year}.png`, 'image/png', blob);
    if (how === 'downloaded') toast('Picture saved');
  },
  open(el) { open = open === el.dataset.id ? null : el.dataset.id; rerender(); },
  prep(el) {
    const p = prepState(S, todayISO());
    const i = el.dataset.i;
    if (p.checks[i]) delete p.checks[i]; else p.checks[i] = true;
    save(); rerender();
  },
};
