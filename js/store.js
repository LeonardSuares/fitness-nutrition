// All app data lives in one JSON document in localStorage.
import { SEED } from '../data/seed.js';

const KEY = 'steady.data.v1';
const BACKUP = 'steady.backup.v';   // + the schema number the copy was taken at
export const SCHEMA = 3;

export let S = null;

const clone = (o) => JSON.parse(JSON.stringify(o));
const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

function fresh() {
  return {
    config: clone(SEED),
    days: {},        // "YYYY-MM-DD": { type?, checks: {}, water: 0, walk?, food: [] }
    sessions: [],    // { date, workoutId, size, rounds, entries }
    weighIns: [],    // { date, kg }
    prep: { weekOf: null, checks: {} },
    badges: {},      // id: date earned
    rises: [],       // dates a Rise Again was earned
    savings: {},     // "YYYY-MM": amount saved that month
    learning: {},    // "itemId@period": date ticked (period: YYYY, YYYY-Qn or YYYY-MM)
    draft: null,     // workout in progress
    meta: { schemaVersion: SCHEMA, firstRunDone: false, startDate: null, lastExport: null, snoozeSuggestUntil: null },
  };
}

// Add any keys that are missing, without touching what is already there.
function fill(target, defaults) {
  for (const k of Object.keys(defaults)) {
    if (target[k] == null) target[k] = clone(defaults[k]);
    else if (isObj(target[k]) && isObj(defaults[k])) fill(target[k], defaults[k]);
  }
}

// ── migrations ───────────────────────────────────────────────────────────────
// MIGRATIONS[n] upgrades a document from schema n to n + 1. They only ever add
// or reshape; nothing that was logged is removed.
const MIGRATIONS = {
  // 1 → 2: the single weight target gives way to the year's goals.
  1(d) {
    d.config.goals = clone(SEED.goals);
    delete d.config.target;
  },
  // 2 → 3: the six daily taps. Breakfast, lunch, dinner and the workout item
  // leave the checklists (which become the extras); past meal ticks become
  // meals eaten. The old ticks themselves are left in place.
  2(d) {
    const merged = (it) => ['breakfast', 'lunch', 'water-wake'].includes(it.id) || ['dinner', 'workout'].includes(it.kind);
    for (const k of Object.keys(d.config.checklists || {})) d.config.checklists[k] = d.config.checklists[k].filter((it) => !merged(it));
    for (const day of Object.values(d.days || {})) {
      const c = day.checks || {};
      if (!day.meals && (c.breakfast || c.lunch || c.dinner)) day.meals = [c.breakfast ? 1 : 0, c.lunch ? 1 : 0, c.dinner ? 1 : 0];
    }
  },
};

// Returns true if the document was upgraded. `raw` is the stored text, kept
// untouched under a separate key before the first change is made.
function migrate(d, raw) {
  let v = d.meta?.schemaVersion || 1;
  if (v >= SCHEMA) return false;
  try {
    if (raw && !localStorage.getItem(BACKUP + v)) localStorage.setItem(BACKUP + v, raw);
  } catch { /* storage full: the upgrade itself removes nothing that was logged */ }
  if (!isObj(d.config)) d.config = clone(SEED);
  for (; v < SCHEMA; v++) MIGRATIONS[v](d);
  d.meta = { ...d.meta, schemaVersion: SCHEMA };
  return true;
}

export function load() {
  let raw = null, migrated = false;
  try {
    raw = localStorage.getItem(KEY);
    S = raw ? JSON.parse(raw) : fresh();
    if (!isObj(S)) throw new Error('not an object');
    migrated = migrate(S, raw);
  } catch {
    // Unreadable data: set it aside rather than let the next save overwrite it.
    try { if (raw) localStorage.setItem('steady.unreadable', raw); } catch { /* nothing more to do */ }
    S = fresh();
  }
  // Fill anything missing (older exports, hand-edited files).
  const f = fresh();
  for (const k of Object.keys(f)) if (S[k] == null) S[k] = f[k];
  for (const k of Object.keys(f.config)) if (S.config[k] == null) S.config[k] = f.config[k];
  fill(S.config.goals, f.config.goals);
  S.meta = { ...f.meta, ...S.meta };
  if (migrated) save();
  return S;
}

export function save() {
  localStorage.setItem(KEY, JSON.stringify(S));
}

export function exportJSON() {
  return JSON.stringify({ app: 'steady', exportedAt: new Date().toISOString(), data: S }, null, 2);
}

// Returns an error message, or null on success. Older backups are upgraded.
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

// Replace the plan (checklists, weekly plan, workouts) with the seed file,
// keeping everything that was logged and the goals set on this phone.
export function reloadSeed() {
  const { goals } = S.config;
  S.config = clone(SEED);
  S.config.goals = goals;
  save();
}
