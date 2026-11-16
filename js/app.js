import { S, load, save } from './store.js';
import { register, init, render, esc, toast } from './core.js';
import { todayISO, weightPath } from './logic.js';
import * as today from './ui-today.js';
import * as workout from './ui-workout.js';
import * as progress from './ui-progress.js';
import * as plan from './ui-plan.js';
import * as settings from './ui-settings.js';

// First run: confirm current weight, then start.
const welcome = {
  render: () => `
    <div class="welcome">
      <h1>Welcome</h1>
      <p>A few small things each day. Easy, quick and steady.</p>
      <section class="card fields">
        <label class="opt">Your weight today (kg)
          <input id="start-kg" type="number" inputmode="decimal" step="0.1" value="${esc(S.config.profile.startWeightKg)}">
        </label>
        <p class="muted">The goal is ${esc(weightPath(S).pop()?.kg ?? '')} kg, at a gentle pace. You can change it later in Settings.</p>
      </section>
      <button class="btn primary big-btn" data-act="start">Start</button>
    </div>`,
  actions: {
    start() {
      const kg = Math.round(parseFloat(document.getElementById('start-kg').value) * 10) / 10;
      if (!kg || kg < 30 || kg > 250) return toast('Enter your weight in kg');
      const d = todayISO();
      S.config.profile.startWeightKg = kg;
      S.weighIns = [{ date: d, kg }];
      S.meta.startDate = d;
      S.meta.firstRunDone = true;
      save();
      render();
    },
  },
};

load();
register('welcome', welcome);
register('today', today);
register('workout', workout);
register('progress', progress);
register('plan', plan);
register('settings', settings);
init();

// Refresh when the app comes back to the front (new day, etc.).
let shownOn = todayISO();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && todayISO() !== shownOn) { shownOn = todayISO(); render(); }
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
// Ask the browser to keep our data rather than evict it when space is short.
navigator.storage?.persist?.();
