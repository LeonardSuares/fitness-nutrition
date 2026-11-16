// Builds the reminder list and an .ics calendar file of recurring events.
import { REMINDERS } from '../data/seed.js';
import { workoutById, todayISO, addDays, dow, DAY_NAMES, timeText } from './logic.js';

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const daysText = (days) =>
  days.length === 7 ? 'Every day'
    : days.join() === '1,2,3,4,5' ? 'Weekdays'
    : days.map((d) => DAY_NAMES[d]).join(', ');

// Expanded list: [{ id, title, time, days: [0..6], when }]
export function reminderList(S) {
  const out = [];
  for (const src of REMINDERS) {
    const r = src.time.startsWith('rhythm.') ? { ...src, time: S.config.goals.rhythm[src.time.slice(7)] || '06:00' } : src;
    if (r.days === 'workout') {
      const byWorkout = {};
      S.config.weeklyPlan.forEach((p, day) => {
        const w = workoutById(S, p.workout);
        if (w && w.kind !== 'walk') (byWorkout[w.id] ||= []).push(day);
      });
      for (const [id, days] of Object.entries(byWorkout)) {
        const w = workoutById(S, id);
        out.push({ id: `workout-${id}`, title: w.reminder || `10 minutes is enough. ${w.name}?`, time: r.time, days });
      }
      continue;
    }
    const days = r.days === 'daily' ? [0, 1, 2, 3, 4, 5, 6]
      : r.days === 'weekdays' ? [1, 2, 3, 4, 5]
      : r.days === 'weighin' ? [S.config.weighInDay]
      : r.days;
    out.push({ id: r.id, title: r.title, time: r.time, days });
  }
  return out.map((r) => ({ ...r, when: `${daysText(r.days)}, ${timeText(r.time)}` }));
}

const text = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');

export function buildICS(reminders) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Steady//Reminders//EN', 'CALSCALE:GREGORIAN'];
  for (const r of reminders) {
    // First date on or after today that matches the rule.
    let d = todayISO();
    while (!r.days.includes(dow(d))) d = addDays(d, 1);
    const hhmm = r.time.replace(':', '');
    const rule = r.days.length === 7 ? 'FREQ=DAILY' : `FREQ=WEEKLY;BYDAY=${r.days.map((x) => BYDAY[x]).join(',')}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:steady-${r.id}@steady.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${d.replace(/-/g, '')}T${hhmm}00`, // floating local time
      'DURATION:PT10M',
      `RRULE:${rule}`,
      `SUMMARY:${text(r.title)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${text(r.title)}`, 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
