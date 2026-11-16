// ─────────────────────────────────────────────────────────────────────────────
// SEED / PLAN FILE: the one place to change the plan.
//
// SEED  = starting settings. Copied onto the phone on first run, then edited
//         through the Settings tab. If you change SEED here later, use
//         Settings → "Reload plan from seed file" to pick the changes up
//         (your logged days, workouts and weigh-ins are kept).
// PLAN  = read-only reference pages (Plan tab). Always read live from here.
// REMINDERS = calendar reminders offered in Settings.
// ─────────────────────────────────────────────────────────────────────────────

export const SEED = {
  profile: {
    heightCm: 171,
    startWeightKg: 90.5,
  },
  target: { weightKg: 85, date: '2027-03-31' },

  // 0 = Sunday … 6 = Saturday. Only the default; one tap on Today changes a day.
  officeDays: [1, 2, 3],
  weighInDay: 6,

  motivation: { quotes: true, verses: true },

  // What an office day asks for: a walk, plus an optional bonus workout.
  officeBonus: 'kettlebell',

  // Session for each day when it is NOT an office day. workout: id from
  // `workouts` below, or null with rest: true for a rest day.
  weeklyPlan: [
    { workout: null, rest: true },   // Sunday: long walk on the checklist, prep, rest
    { workout: 'kettlebell' },       // Monday (if working from home)
    { workout: 'bike' },             // Tuesday (if working from home)
    { workout: 'kettlebell' },       // Wednesday (if working from home)
    { workout: 'kettlebell' },       // Thursday
    { workout: 'bike' },             // Friday
    { workout: 'barbell' },          // Saturday (long walk is on the checklist too)
  ],

  // Checklist items. `kind` gives an item special behaviour:
  //   walk    → counts as the day's activity for the streak
  //   workout → shows today's workout, opens the Workout tab, ticks itself
  //   dinner  → shows tonight's dish from the dinner rotation
  //   prep    → opens the Sunday prep list (use with days: [0])
  // `days` (optional) limits an item to certain weekdays.
  checklists: {
    home: [
      { id: 'water-wake', time: '6:00', label: 'Water on waking (500 ml)' },
      { id: 'breakfast', time: '7:30', label: 'Breakfast: 2 boiled eggs, soaked almonds, 1 fruit' },
      { id: 'supps', time: '7:30', label: 'Multivitamin + CoQ10' },
      { id: 'lunch', time: '12:00', label: 'Lunch shake (Vega + milk) and a fruit' },
      { id: 'walk', time: '12:10', label: 'Walk', kind: 'walk' },
      { id: 'snack', time: '3:00', label: 'Snack: curd and fruit, roasted chana, or a boiled egg' },
      { id: 'psyllium', time: '6:00', label: 'Psyllium in a full glass of water' },
      { id: 'dinner', time: '6:30', label: 'Dinner', kind: 'dinner' },
      { id: 'workout', time: '7:45', label: "Today's workout", kind: 'workout' },
      { id: 'night', time: 'Night', label: 'Soak almonds for tomorrow' },
    ],
    office: [
      { id: 'water-wake', time: '6:00', label: 'Water on waking (500 ml)' },
      { id: 'breakfast', time: '7:30', label: 'Breakfast at desk: 2 boiled eggs, soaked almonds, 1 fruit' },
      { id: 'supps', time: '7:30', label: 'Multivitamin + CoQ10' },
      { id: 'lunch', time: '12:00', label: 'Lunch shake (packed shake kit) and a fruit' },
      { id: 'walk', time: '12:10', label: 'Walk', kind: 'walk' },
      { id: 'snack', time: '3:00', label: 'Snack: curd and fruit, roasted chana, or a boiled egg' },
      { id: 'psyllium', time: '6:00', label: 'Psyllium in a full glass of water' },
      { id: 'dinner', time: '6:30', label: 'Dinner', kind: 'dinner' },
      { id: 'workout', time: '7:45', label: "Today's workout", kind: 'workout' },
      { id: 'night', time: 'Night', label: 'Pack for tomorrow: eggs, almonds, fruit, shake kit, snack, water bottle' },
    ],
    weekend: [
      { id: 'water-wake', time: 'Morning', label: 'Water on waking (500 ml)' },
      { id: 'breakfast', time: 'Morning', label: 'Breakfast' },
      { id: 'supps', time: 'Morning', label: 'Multivitamin + CoQ10' },
      { id: 'workout', time: 'Daytime', label: "Today's workout", kind: 'workout' },
      { id: 'long-walk', time: 'Daytime', label: 'Long walk', kind: 'walk' },
      { id: 'prep', time: 'Daytime', label: 'Sunday prep', kind: 'prep', days: [0] },
      { id: 'psyllium', time: '6:00', label: 'Psyllium in a full glass of water' },
      { id: 'dinner', time: '6:30', label: 'Dinner', kind: 'dinner' },
    ],
  },

  // Workout library.
  //   kind: 'strength' | 'bike' | 'walk'
  //   rounds: true shows a round counter
  //   fields: optional session-level numbers (minutes, distance, steps)
  //   exercise.track: 'weight' adds an optional weight box (remembers last time)
  //   exercise.only: sizes the exercise appears in (omit for all sizes)
  workouts: [
    {
      id: 'kettlebell',
      name: 'Kettlebell circuit',
      kind: 'strength',
      note: '20 lb bell, both hands.',
      rounds: true,
      reminder: '10 minutes is enough. Kettlebell?',
      sizes: { quick: '1 round', standard: '2–3 rounds', full: '4–5 rounds' },
      exercises: [
        { id: 'kb-row', name: '5 rows', cue: 'Hinge forward with a flat back and pull the bell to your belly.' },
        { id: 'kb-clean', name: '5 cleans', cue: 'Keep the bell close to your body and let your hips do the lifting.' },
        { id: 'kb-swing', name: '5 swings', cue: 'Push your hips back, then snap them forward. Arms just guide the bell.' },
        { id: 'kb-squat', name: '5 goblet squats', cue: 'Bell at your chest, sit down between your knees, chest tall.' },
        { id: 'kb-curl', name: '5 bicep curls', cue: 'Elbows stay by your sides. Lift and lower slowly.' },
        { id: 'kb-tri', name: '5 tricep extensions', cue: 'Bell behind your head, elbows pointing forward, press straight up.' },
        { id: 'kb-pull', name: '5 pullovers', cue: 'Lie back, arms nearly straight, lower the bell only as far as feels easy.' },
        { id: 'kb-halo', name: '10 alternating halos', cue: 'Circle the bell slowly around your head, ribs down, no rush.' },
        { id: 'kb-push', name: '10 pushups', cue: 'Body in one straight line. Knees down is completely fine.' },
      ],
    },
    {
      id: 'bike',
      name: 'Easy bike',
      kind: 'bike',
      note: 'Conversational pace. Fine to do while watching TV.',
      reminder: 'Easy spin while you watch something?',
      sizes: { quick: '10 minutes', standard: '20 minutes', full: '30 minutes' },
      fields: ['minutes', 'distance'],
      exercises: [
        { id: 'bike-ride', name: 'Ride', cue: 'Easy enough that you could hold a conversation the whole time.' },
      ],
    },
    {
      id: 'barbell',
      name: 'Barbell basics',
      kind: 'strength',
      note: 'Start light. Good reps matter more than the number on the bar.',
      reminder: 'One set each counts. Barbell?',
      sizes: {
        quick: '1 set of 8–10 each',
        standard: '2 sets of 8–10 each',
        full: '3 sets of 8–10 each, plus a plank',
      },
      exercises: [
        { id: 'bb-squat', name: 'Squat', cue: 'Feet shoulder-width, sit back and down, knees follow your toes.', track: 'weight' },
        { id: 'bb-bench', name: 'Bench press', cue: 'Feet planted, lower the bar to mid-chest with control, press up.', track: 'weight' },
        { id: 'bb-row', name: 'Barbell row', cue: 'Flat back, hinge at the hips, pull the bar to your lower ribs.', track: 'weight' },
        { id: 'bb-plank', name: 'Plank', cue: 'Elbows under shoulders, squeeze your glutes, breathe steadily.', only: ['full'] },
      ],
    },
    {
      id: 'walk',
      name: 'Walk',
      kind: 'walk',
      note: 'Any walk counts.',
      sizes: { quick: '5–10 minutes', standard: '15–20 minutes', full: '30+ minutes' },
      fields: ['minutes', 'steps'],
      exercises: [
        { id: 'walk-go', name: 'Walk', cue: 'Comfortable pace, shoulders relaxed, enjoy being outside.' },
      ],
    },
  ],
};

// ── Plan tab (read-only reference) ──────────────────────────────────────────
export const PLAN = {
  // Cycles in this order, one dish a night.
  dinners: [
    'Chole with roti and salad',
    'Palak or matar paneer with roti',
    'Dal tadka with egg bhurji and roti',
    'Rajma with a small rice portion and salad',
    'Paneer or tofu tikka with sautéed vegetables',
    'Egg curry (chicken optional)',
    'Moong dal khichdi with raita',
  ],
  sundayPrep: [
    'Boil 10–12 eggs',
    'Pressure-cook two legumes',
    'Pot of plain dal',
    'Hung curd',
    'Marinate paneer or tofu',
    'Soak moong for sprouts',
    'Onion-tomato masala cubes',
    'Protein atta mix (3 parts atta, 1 part besan or soy flour)',
    'Chilla batter',
    'Chop salad vegetables',
    'Shake kits for office days',
    'Snack jars',
    'Soak almonds',
  ],
  psylliumRules: [
    '1 tsp in at least 250 ml of water',
    'Drink it straight away, before it thickens',
    'Never take it dry',
    'Keep it 2+ hours away from supplements and medicines',
    'Drink plenty of water through the day',
  ],
  // Rough figures, for a sense of scale only.
  protein: [
    ['Paneer, 100 g', '18 g'],
    ['Greek yogurt or hung curd, ¾ cup', '15 g'],
    ['Tofu (firm), 100 g', '13 g'],
    ['Soya chunks, 30 g dry', '15 g'],
    ['Besan chilla, 2 medium', '12 g'],
    ['Chana or rajma, 1 cup cooked', '14 g'],
    ['Dal, 1 cup cooked', '10 g'],
    ['Moong sprouts, 1 cup', '7 g'],
    ['Egg, 1 large', '6 g'],
    ['Vega, 1 scoop', '20 g (check your tub)'],
  ],
  targets: [
    ['Protein', 'about 100 g'],
    ['Water', 'about 3 L'],
    ['Sleep', '7–9 hours'],
  ],
};

// ── Calendar reminders (Settings → Reminders) ───────────────────────────────
// days: 'daily' | 'weekdays' | 'weighin' | 'workout' | [weekday numbers]
// 'workout' expands to one reminder per workout, on the days it is planned,
// using each workout's own `reminder` title.
export const REMINDERS = [
  { id: 'water-am', title: 'Water break. A glass now?', time: '10:00', days: 'weekdays' },
  { id: 'water-pm', title: 'Afternoon water. One more glass', time: '14:00', days: 'weekdays' },
  { id: 'psyllium', title: 'Psyllium time. Full glass of water', time: '18:00', days: 'daily' },
  { id: 'workout', time: '19:45', days: 'workout' },
  { id: 'night', title: 'Soak almonds, pack for tomorrow', time: '21:00', days: 'daily' },
  { id: 'weighin', title: 'Weigh-in morning. Just one number', time: '07:00', days: 'weighin' },
  { id: 'prep', title: 'Sunday prep. Set up an easy week', time: '10:00', days: [0] },
];
