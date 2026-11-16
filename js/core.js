// Tiny router, shared helpers, and event delegation.
import { S, save } from './store.js';
import { awardBadges } from './logic.js';

const mods = {};
let tab = 'today';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function register(name, mod) { mods[name] = mod; }

function current() { return S.meta.firstRunDone ? mods[tab] : mods.welcome; }

export function render() {
  const first = !S.meta.firstRunDone;
  document.getElementById('tabs').hidden = first;
  document.getElementById('view').innerHTML = current().render();
  for (const b of document.querySelectorAll('#tabs button')) {
    b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false');
  }
}

export function go(t) {
  tab = t;
  mods[t].enter?.();
  render();
  window.scrollTo(0, 0);
}

// Save, re-render, and announce any newly earned badges.
export function commit({ quiet = false } = {}) {
  const fresh = awardBadges(S);
  save();
  render();
  if (fresh.length && !quiet) toast(`Badge earned: ${fresh.map((b) => b.name).join(', ')}`);
  return fresh;
}

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

export function overlay(html) {
  closeOverlay();
  const el = document.createElement('div');
  el.className = 'overlay';
  el.id = 'overlay';
  el.innerHTML = `<div class="overlay-card">${html}</div>`;
  document.body.append(el);
}
export function closeOverlay() { document.getElementById('overlay')?.remove(); }

// Hand a generated file to the user. On iPhone the share sheet is the
// dependable route from a home-screen app; elsewhere a normal download.
export async function deliverFile(name, mime, text) {
  const file = new File([text], name, { type: mime });
  const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  if (iOS && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  return 'downloaded';
}

export function init() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'tab') return go(el.dataset.tab);
    if (act === 'closeOverlay') return closeOverlay();
    current().actions?.[act]?.(el, e);
  });
  const onChange = (e) => {
    const el = e.target.closest('[data-chg]');
    if (el) current().changes?.[el.dataset.chg]?.(el, e);
  };
  document.addEventListener('change', onChange);
  render();
}
