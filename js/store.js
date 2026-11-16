// All app data lives in one JSON document in localStorage.
import { SEED } from '../data/seed.js';

const KEY = 'steady.data.v1';
export const SCHEMA = 1;

export let S = null;

const clone = (o) => JSON.parse(JSON.stringify(o));

function fresh() {
  return {
    config: clone(SEED),
    days: {},        // "YYYY-MM-DD": { type?, checks: {}, water: 0, walk?, food: [] }
    sessions: [],    // { date, workoutId, size, rounds, entries }
    weighIns: [],    // { date, kg }
    prep: { weekOf: null, checks: {} },
    badges: {},      // id: date earned
    draft: null,     // workout in progress
    meta: { schemaVersion: SCHEMA, firstRunDone: false, startDate: null, lastExport: null, snoozeSuggestUntil: null },
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    S = raw ? JSON.parse(raw) : fresh();
  } catch {
    S = fresh();
  }
  // Fill anything missing (older exports, hand-edited files).
  const f = fresh();
  for (const k of Object.keys(f)) if (S[k] == null) S[k] = f[k];
  for (const k of Object.keys(f.config)) if (S.config[k] == null) S.config[k] = f.config[k];
  S.meta = { ...f.meta, ...S.meta };
  return S;
}

export function save() {
  localStorage.setItem(KEY, JSON.stringify(S));
}

export function exportJSON() {
  return JSON.stringify({ app: 'steady', exportedAt: new Date().toISOString(), data: S }, null, 2);
}

// Returns an error message, or null on success.
export function importJSON(text) {
  let obj;
  try { obj = JSON.parse(text); } catch { return 'That file is not valid JSON.'; }
  const d = obj && obj.app === 'steady' ? obj.data : null;
  if (!d || !d.config || !d.days || !Array.isArray(d.sessions)) return 'That does not look like a backup from this app.';
  localStorage.setItem(KEY, JSON.stringify(d));
  load();
  save();
  return null;
}

// Replace settings with the seed file, keeping everything that was logged.
export function reloadSeed() {
  S.config = clone(SEED);
  save();
}
