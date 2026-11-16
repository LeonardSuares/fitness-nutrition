import { S } from './store.js';
import { esc, commit, toast } from './core.js';
import { todayISO, sortedWeighIns, pace, weekStats, daysBetween, fmtDate, BADGES, DAY_NAMES, streak } from './logic.js';

function chart() {
  const w = sortedWeighIns(S);
  if (!w.length) return '';
  const { weightKg: target, date: targetDate } = S.config.target;
  const start = w[0];
  const end = targetDate > w[w.length - 1].date ? targetDate : w[w.length - 1].date;
  const span = Math.max(1, daysBetween(start.date, end));
  const kgs = w.map((x) => x.kg).concat(target);
  const lo = Math.min(...kgs) - 1, hi = Math.max(...kgs) + 1;
  const W = 340, H = 180, L = 34, R = 12, T = 12, B = 24;
  const x = (d) => L + (daysBetween(start.date, d) / span) * (W - L - R);
  const y = (kg) => T + ((hi - kg) / (hi - lo)) * (H - T - B);
  const pts = w.map((p) => `${x(p.date).toFixed(1)},${y(p.kg).toFixed(1)}`);
  const last = w[w.length - 1];
  const short = { day: 'numeric', month: 'short' };
  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend from ${start.kg} kg toward ${target} kg">
      <line class="grid" x1="${L}" x2="${W - R}" y1="${y(start.kg)}" y2="${y(start.kg)}"/>
      <line class="grid" x1="${L}" x2="${W - R}" y1="${y(target)}" y2="${y(target)}"/>
      <text class="axis" x="${L - 6}" y="${y(start.kg) + 4}" text-anchor="end">${start.kg}</text>
      <text class="axis" x="${L - 6}" y="${y(target) + 4}" text-anchor="end">${target}</text>
      <line class="target" x1="${x(start.date)}" y1="${y(start.kg)}" x2="${x(targetDate)}" y2="${y(target)}"/>
      ${pts.length > 1 ? `<polyline class="trend" points="${pts.join(' ')}"/>` : ''}
      ${w.map((p) => `<circle class="pt" cx="${x(p.date).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="3"/>`).join('')}
      <circle class="pt now" cx="${x(last.date).toFixed(1)}" cy="${y(last.kg).toFixed(1)}" r="5"/>
      <text class="axis" x="${L}" y="${H - 6}">${esc(fmtDate(start.date, short))}</text>
      <text class="axis" x="${W - R}" y="${H - 6}" text-anchor="end">${esc(fmtDate(targetDate, { month: 'short', year: 'numeric' }))}</text>
    </svg>
    <p class="legend"><span class="key solid"></span>You <span class="key dashed"></span>Path to ${target} kg</p>`;
}

export function render() {
  const d = todayISO();
  const w = sortedWeighIns(S);
  const last = w[w.length - 1];
  const p = pace(S);
  const st = weekStats(S, d);
  const sk = streak(S, d);
  const recent = w.slice(-5).reverse();

  return `
    <header class="head"><div><p class="eyebrow">Progress</p><h1>${last ? `${last.kg} kg` : 'No weigh-in yet'}</h1></div></header>

    <section class="card">
      ${chart()}
      <p class="pace">${esc(p.text)}</p>
    </section>

    <section class="card">
      <div class="card-head"><h2>Weigh-in</h2><span class="muted">${DAY_NAMES[S.config.weighInDay]} mornings</span></div>
      <div class="inline-form">
        <input id="kg" type="number" inputmode="decimal" step="0.1" min="30" max="250" placeholder="kg" aria-label="Weight in kg">
        <button class="btn primary" data-act="weigh">Save</button>
      </div>
      ${recent.length ? `<ul class="plain small">${recent.map((x) => `
        <li><span>${esc(fmtDate(x.date, { day: 'numeric', month: 'short', year: 'numeric' }))}</span><span>${x.kg} kg
          ${w.length > 1 ? `<button class="x" data-act="delWeigh" data-date="${x.date}" aria-label="Remove this weigh-in">×</button>` : ''}</span></li>`).join('')}</ul>` : ''}
    </section>

    <section class="card">
      <h2>This week</h2>
      <div class="stats">
        <div><div class="big">${st.workouts}</div><span class="muted">workouts</span></div>
        <div><div class="big">${st.walks}</div><span class="muted">walks</span></div>
        <div><div class="big">${st.waterAvg.toFixed(1)} L</div><span class="muted">water a day</span></div>
        <div><div class="big">${st.checklistPct}%</div><span class="muted">checklist</span></div>
      </div>
      <p class="muted">${sk.count ? `${sk.count} active ${sk.count === 1 ? 'day' : 'days'} in your current run.` : 'Your run starts with the next walk or workout.'}</p>
    </section>

    <section class="card">
      <h2>Badges</h2>
      <div class="badges">${BADGES.map((b) => `
        <div class="badge ${S.badges[b.id] ? 'on' : ''}"><span class="badge-icon">${b.icon}</span><span>${esc(b.name)}</span></div>`).join('')}
      </div>
    </section>`;
}

export const actions = {
  weigh() {
    const kg = Math.round(parseFloat(document.getElementById('kg').value) * 10) / 10;
    if (!kg || kg < 30 || kg > 250) return toast('Enter your weight in kg');
    const d = todayISO();
    S.weighIns = S.weighIns.filter((x) => x.date !== d);
    S.weighIns.push({ date: d, kg });
    commit();
    toast('Weigh-in saved');
  },
  delWeigh(el) {
    S.weighIns = S.weighIns.filter((x) => x.date !== el.dataset.date);
    commit();
  },
};
