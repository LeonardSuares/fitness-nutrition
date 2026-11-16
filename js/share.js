// The monthly scorecard as a picture to send (1080 × 1350, light colours).
import { monthSummary, monthDays } from './score.js';

const C = { bg: '#f4f2ee', card: '#ffffff', text: '#2b2a28', muted: '#7a766f', line: '#e7e3dc', accent: '#55806f', soft: '#e4ede8', on: '#ffffff' };
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, "Iowan Old Style", serif';

function round(x, X, Y, W, H, r, fill) {
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + W, Y, X + W, Y + H, r);
  x.arcTo(X + W, Y + H, X, Y + H, r);
  x.arcTo(X, Y + H, X, Y, r);
  x.arcTo(X, Y, X + W, Y, r);
  x.closePath();
  x.fillStyle = fill;
  x.fill();
}

function text(x, s, X, Y, font, color, align = 'left') {
  x.font = font;
  x.fillStyle = color;
  x.textAlign = align;
  x.fillText(s, X, Y);
}

export function drawMonth(S, ym, today) {
  const s = monthSummary(S, ym, today);
  const g = S.config.goals;
  const W = 1080, H = 1350, M = 64;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = C.bg;
  x.fillRect(0, 0, W, H);

  text(x, `STEADY  ·  ${s.tag.toUpperCase()}`, M, 104, `600 28px ${SANS}`, C.muted);
  text(x, s.title, M, 184, `700 72px ${SANS}`, C.text);
  text(x, `Showed up ${s.t.shown} ${s.t.shown === 1 ? 'day' : 'days'}`, M, 248, `600 40px ${SANS}`, C.accent);
  if (s.t.allSix) text(x, `All six on ${s.t.allSix} ${s.t.allSix === 1 ? 'day' : 'days'}`, W - M, 248, `400 30px ${SANS}`, C.muted, 'right');

  // Numbers.
  const rowH = 58, top = 290, cardH = 36 + s.rows.length * rowH;
  round(x, M - 16, top, W - 2 * (M - 16), cardH, 28, C.card);
  s.rows.forEach((r, i) => {
    const y = top + 56 + i * rowH;
    if (i) { x.fillStyle = C.line; x.fillRect(M + 12, y - 38, W - 2 * (M + 12), 2); }
    text(x, r.label, M + 12, y, `400 32px ${SANS}`, C.text);
    x.font = `400 28px ${SANS}`;
    const noteW = r.note ? x.measureText(` ${r.note}`).width : 0;
    text(x, r.note ? ` ${r.note}` : '', W - M - 12, y, `400 28px ${SANS}`, C.muted, 'right');
    text(x, String(r.value), W - M - 12 - noteW, y, `700 32px ${SANS}`, C.text, 'right');
  });

  // Calendar, Monday first.
  const days = monthDays(S, ym, today);
  const calTop = top + cardH + 40;
  const lead = (new Date(`${ym}-01T12:00:00`).getDay() + 6) % 7;
  const cols = 7, cw = (W - 2 * M) / cols, rh = 62, r = 24;
  ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((l, i) => text(x, l, M + cw * i + cw / 2, calTop + 20, `600 24px ${SANS}`, C.muted, 'center'));
  days.forEach((d, i) => {
    const k = i + lead, cx = M + cw * (k % cols) + cw / 2, cy = calTop + 62 + Math.floor(k / cols) * rh;
    x.globalAlpha = d.level === 'future' || d.level === 'before' ? 0.4 : 1;
    if (d.level === 'shown' || d.level === 'all') {
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
      x.fillStyle = d.level === 'all' ? C.accent : C.soft; x.fill();
    }
    const color = d.level === 'all' ? C.on : d.level === 'shown' ? C.accent : C.muted;
    text(x, String(d.day), cx, cy + 9, `${d.level === 'none' || d.level === 'future' || d.level === 'before' ? 400 : 700} 24px ${SANS}`, color, 'center');
    x.globalAlpha = 1;
  });

  text(x, `${g.word}  ·  ${g.verseRef}`, W / 2, H - 56, `italic 400 30px ${SERIF}`, C.muted, 'center');
  return cv;
}

export function monthImage(S, ym, today) {
  return new Promise((resolve) => drawMonth(S, ym, today).toBlob(resolve, 'image/png'));
}
