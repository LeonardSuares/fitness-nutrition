// The liturgical year, the saint of the month, and Bible-reading pace.
import { SAINTS, BOOKS } from '../data/faith.js';
import { iso, addDays, dow, daysBetween } from './logic.js';

// Easter Sunday (Gregorian), by the anonymous algorithm.
export function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(new Date(y, month - 1, day));
}

// First Sunday of Advent: four Sundays before Christmas.
export function adventStart(y) {
  const xmas = `${y}-12-25`, w = dow(xmas);
  return addDays(xmas, -(w === 0 ? 7 : w) - 21);
}

// Baptism of the Lord, which closes the Christmas season (US calendar:
// Epiphany on the Sunday from Jan 2 to 8; Baptism the Sunday after, or the
// Monday after when Epiphany falls on Jan 7 or 8).
export function baptism(y) {
  let ep = `${y}-01-02`;
  while (dow(ep) !== 0) ep = addDays(ep, 1);
  return Number(ep.slice(8)) >= 7 ? addDays(ep, 1) : addDays(ep, 7);
}

const S_ = (id, name, tint) => ({ id, name, tint });
export function season(d) {
  const y = Number(d.slice(0, 4));
  const e = easter(y);
  if (d <= baptism(y)) return S_('christmas', 'Christmas', 'gold');
  if (d < addDays(e, -46)) return S_('ordinary', 'Ordinary Time', '');
  if (d < addDays(e, -7)) return S_('lent', 'Lent', 'violet');
  if (d < e) return S_('holyweek', 'Holy Week', d === addDays(e, -7) || d === addDays(e, -2) ? 'red' : 'violet');
  const pentecost = addDays(e, 49);
  if (d < pentecost) return S_('easter', 'Easter', 'gold');
  if (d === pentecost) return S_('pentecost', 'Pentecost', 'red');
  if (d < adventStart(y)) return S_('ordinary', 'Ordinary Time', '');
  if (d < `${y}-12-25`) return S_('advent', 'Advent', 'violet');
  return S_('christmas', 'Christmas', 'gold');
}

export const saintFor = (d) => SAINTS[Number(d.slice(5, 7)) - 1];

// ── reading pace ─────────────────────────────────────────────────────────────
const CUM = BOOKS.reduce((a, [, n]) => (a.push(a[a.length - 1] + n), a), [0]);
export const TOTAL_CHAPTERS = CUM[CUM.length - 1];

// The book the plan would have you in on a date.
export function paceBook(S, d) {
  const g = S.config.goals.scripture;
  const span = Math.max(1, daysBetween(g.start, g.end) + 1);
  const at = Math.min(1, Math.max(0, (daysBetween(g.start, d) + 0.5) / span)) * TOTAL_CHAPTERS;
  let i = 0;
  while (i < BOOKS.length - 1 && CUM[i + 1] <= at) i++;
  return i;
}

// Where you said you are, against the plan. Being in a book counts as being
// halfway through it, so this is a gentle estimate, not a verdict.
export function readingPace(S, d) {
  const where = S.scripture?.book;
  if (where == null || !BOOKS[where]) return null;
  const g = S.config.goals.scripture;
  const book = BOOKS[where][0];
  if (d < g.start) return { book, state: 'before', text: `${book} · plan starts ${g.start.slice(5) === '01-01' ? 'January 1' : g.start}` };
  if (d > g.end) return { book, state: 'after', text: book };
  const span = Math.max(1, daysBetween(g.start, g.end) + 1);
  const perDay = TOTAL_CHAPTERS / span;
  const at = CUM[where] + BOOKS[where][1] / 2;
  const planned = Math.min(1, (daysBetween(g.start, d) + 0.5) / span) * TOTAL_CHAPTERS;
  const days = (at - planned) / perDay;
  const state = days > 10 ? 'ahead' : days >= -10 ? 'on' : 'behind';
  const text = { ahead: 'a little ahead', on: 'on pace', behind: 'a little behind, and that’s okay' }[state];
  return { book, state, days: Math.round(days), paceBook: BOOKS[paceBook(S, d)][0], text: `${book} · ${text}` };
}
