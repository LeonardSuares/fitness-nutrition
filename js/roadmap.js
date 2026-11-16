// The year on one page: four quarters as a path, the year's goals and the
// year verse. Shared by the Plan tab and the 1080 × 1920 picture.
import { addDays, fmtDate, quarterOf, timeText, weightPath } from './logic.js';
import { season } from './faith.js';
import { quarterStart, quarterEnd, money, planYear } from './score.js';

// An exact excerpt of the year verse (RSV-2CE), short enough for one screen.
export const YEAR_VERSE = {
  text: 'let us run with perseverance the race that is set before us, looking to Jesus the pioneer and perfecter of our faith',
  ref: 'Hebrews 12:1-2',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const lastWord = (s) => s.trim().split(/\s+/).pop().toLowerCase();

// The seasons a quarter passes through, and the tint that colours most of it.
function seasonsOf(from, to) {
  const names = [], tints = {};
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const s = season(d);
    if (s.tint) tints[s.tint] = (tints[s.tint] || 0) + 1;
    const name = s.id === 'holyweek' ? 'Lent' : s.name;
    if (!names.includes(name)) names.push(name);
  }
  const shown = names.filter((n) => n !== 'Ordinary Time');
  const tint = Object.entries(tints).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  return { names: shown.length ? shown : ['Ordinary Time'], tint };
}

function dueIn(item, year, q) {
  const w = item.when || '';
  if (w === 'quarterly') return true;
  if (/^q[1-4]$/.test(w)) return Number(w[1]) === q;
  if (/^m\d+$/.test(w)) return quarterOf(`${year}-${String(w.slice(1)).padStart(2, '0')}-01`) === q;
  return false;
}

export function roadmap(S, today) {
  const g = S.config.goals, y = planYear(S);
  const short = (d) => fmtDate(d, { day: 'numeric', month: 'short' });
  const milestones = weightPath(S).slice(1);
  const st = g.finance.stretch;

  const quarters = [1, 2, 3, 4].map((q) => {
    const from = quarterStart(y, q), to = quarterEnd(y, q);
    const s = seasonsOf(from, to);
    const m = milestones.find((x) => x.date >= from && x.date <= to);
    const saveQ = Number(g.finance.quarters[q - 1]) || 0;
    const targets = [`${g.fitness.perWeek[q - 1]} workouts a week`];
    if (m) targets.push(`${m.kg} kg by ${short(m.date)}`);
    if (saveQ) targets.push(`save ${money(S, saveQ)}`);
    const notes = g.learning.filter((it) => dueIn(it, y, q)).map((it) => it.label);
    if (st.name && st.decideBy >= from && st.decideBy <= to) notes.push(`${st.name}: decide by ${short(st.decideBy)}`);
    if (g.finance.reviewDate >= from && g.finance.reviewDate <= to) notes.push('Review the savings target');
    return {
      q, theme: g.themes[q - 1], months: `${MONTHS[(q - 1) * 3]} – ${MONTHS[q * 3 - 1]}`,
      seasons: s.names, tint: s.tint, targets, notes,
      now: today >= from && today <= to,
    };
  });

  const path = weightPath(S);
  const per = g.fitness.perWeek.map(Number);
  const oneOffs = g.learning.filter((it) => /^[mq]\d+$/.test(it.when || '')).length;
  const repeat = g.learning.filter((it) => it.when === 'monthly' || it.when === 'quarterly')
    .map((it) => `${it.when === 'monthly' ? 12 : 4} ${lastWord(it.label)}s`);
  const total = g.finance.quarters.reduce((a, b) => a + (Number(b) || 0), 0);
  const goals = [
    { label: 'Weight', value: path.length > 1 ? `${path[0].kg} → ${path[path.length - 1].kg} kg` : '' },
    { label: 'Morning workouts', value: new Set(per).size === 1 ? `${per[0]} a week` : `${per[0]} a week, then ${Math.max(...per)}` },
    { label: 'Meals', value: `${g.eating.meals} with protein, ${g.eating.daysPerWeek} days a week` },
    { label: 'Savings', value: total ? money(S, total) : 'set in Settings' },
    { label: 'Learning', value: [oneOffs ? `${oneOffs} certifications` : '', ...repeat].filter(Boolean).join(' · ') },
    { label: 'Scripture', value: `${g.scripture.title}, cover to cover` },
    { label: 'Rhythm', value: `up ${timeText(g.rhythm.wake)}, lights out ${timeText(g.rhythm.lightsOut)}`, pictureOnly: true },
  ].filter((x) => x.value);

  return { year: y, word: g.word, verse: { ...YEAR_VERSE, ref: g.verseRef || YEAR_VERSE.ref }, quarters, goals, before: today < `${y}-01-01` };
}

// ── the picture ──────────────────────────────────────────────────────────────
const C = { bg: '#f4f2ee', card: '#ffffff', text: '#2b2a28', muted: '#7a766f', line: '#e7e3dc', accent: '#55806f' };
const TINT = { '': '#55806f', violet: '#73608c', gold: '#876a24', red: '#a14e3c' };
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, "Iowan Old Style", serif';

function wrap(x, text, maxW) {
  const lines = [];
  let line = '';
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w;
    if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function put(x, s, X, Y, font, color, align = 'left') {
  x.font = font; x.fillStyle = color; x.textAlign = align; x.fillText(s, X, Y);
}

export function drawRoadmap(S, today) {
  const r = roadmap(S, today);
  const W = 1080, H = 1920, M = 84;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = C.bg; x.fillRect(0, 0, W, H);

  put(x, `STEADY  ·  ${r.year}`, M, 132, `600 30px ${SANS}`, C.muted);
  put(x, r.word, M, 236, `700 104px ${SANS}`, C.text);

  // The verse.
  x.font = `italic 400 38px ${SERIF}`;
  let y = 312;
  for (const l of wrap(x, `“${r.verse.text}”`, W - 2 * M)) { put(x, l, M, y, `italic 400 38px ${SERIF}`, C.text); y += 52; }
  put(x, `${r.verse.ref} (RSV-2CE)`, M, y + 6, `400 28px ${SANS}`, C.muted);

  // The path.
  const top = y + 90, step = 244, nodeX = M + 26;
  x.strokeStyle = C.line; x.lineWidth = 6; x.lineCap = 'round';
  x.beginPath(); x.moveTo(nodeX, top + 14); x.lineTo(nodeX, top + 14 + step * 3); x.stroke();
  r.quarters.forEach((q, i) => {
    const cy = top + i * step + 14, tx = nodeX + 64, tint = TINT[q.tint] || C.accent;
    x.beginPath(); x.arc(nodeX, cy, 24, 0, Math.PI * 2); x.fillStyle = tint; x.fill();
    put(x, `${q.q}`, nodeX, cy + 11, `700 30px ${SANS}`, '#ffffff', 'center');
    put(x, `Q${q.q} · ${q.theme}`, tx, cy + 14, `700 48px ${SANS}`, C.text);
    put(x, `${q.months}  ·  ${q.seasons.join(' · ')}`, tx, cy + 62, `600 28px ${SANS}`, tint);
    put(x, q.targets.join('  ·  '), tx, cy + 108, `400 30px ${SANS}`, C.text);
    if (q.notes.length) {
      x.font = `400 28px ${SANS}`;
      wrap(x, q.notes.join('  ·  '), W - tx - M).slice(0, 2).forEach((l, j) => put(x, l, tx, cy + 152 + j * 38, `400 28px ${SANS}`, C.muted));
    }
  });

  // The year's goals.
  const gTop = top + step * 4 - 30;
  const rows = r.goals.length, rowH = 45;
  x.fillStyle = C.card;
  x.beginPath(); x.roundRect ? x.roundRect(M - 24, gTop, W - 2 * (M - 24), 40 + rows * rowH, 28) : x.rect(M - 24, gTop, W - 2 * (M - 24), 40 + rows * rowH);
  x.fill();
  r.goals.forEach((gl, i) => {
    const gy = gTop + 54 + i * rowH;
    put(x, gl.label, M + 8, gy, `600 28px ${SANS}`, C.muted);
    put(x, gl.value, W - M - 8, gy, `400 30px ${SANS}`, C.text, 'right');
  });
  return cv;
}

export function roadmapImage(S, today) {
  return new Promise((resolve) => drawRoadmap(S, today).toBlob(resolve, 'image/png'));
}
