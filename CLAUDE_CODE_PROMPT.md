# Build prompt: Leo's Fitness & Nutrition app

Paste everything below into Claude Code, opened in `D:\fitness-nutrition`.

---

Build me a personal fitness and nutrition app. I'm the only user. I'll use it almost entirely on my iPhone 17, installed to the home screen. The whole point of this app is to help me build a habit, so every choice should favour **easy, quick and encouraging** over complete or detailed. If a feature makes the app feel like work, leave it out.

## Hard constraints

- Static web app, installable to the iPhone home screen (PWA: manifest, icons, service worker, works offline).
- Hosted on **GitHub Pages**, same as my Study Bible app. Set up the repo and a deploy workflow, and walk me through any steps I must do by hand.
- **No backend, no accounts, no paid services, no subscriptions.**
- All data stays on the phone (IndexedDB or localStorage). Add **Export** and **Import** of all data as one JSON file in Settings, so I can back up or move phones.
- Phone-first layout, designed for one-handed use: large tap targets, bottom tab bar, no tiny controls. It should still be usable on a laptop, but don't spend effort there.
- Choose the simplest stack that meets this. Tell me what you chose and why before you start building.
- Look and feel: **calm and minimal.** Soft neutral background, one quiet accent colour, generous spacing, readable type, support for light and dark mode following the phone setting. No clutter, no dense tables.

## About me (seed data)

- Height 171 cm. Starting weight 90.5 kg (ask me to confirm my current weight on first run).
- Goal: general health and energy. Weight target **85 kg by 31 March 2027**, a steady pace of roughly 0.25-0.5 kg a week.
- Mostly vegetarian Indian home cooking; eggs are fine.
- Office days are normally Monday, Tuesday, Wednesday. Thursday and Friday I work from home.
- Equipment: 20 lb kettlebell, stationary bike (shows time and distance), barbell with about 180 lb of plates, dumbbells, bench.
- Supplements: multivitamin and CoQ10 (with breakfast), psyllium husk 1 tsp in a full glass of water at 6:00 pm. Psyllium must stay at least 2 hours away from the other supplements.

Keep all of this in one editable config/seed file so I can change the plan later without digging through code.

## Screens

Bottom tabs: **Today, Workout, Progress, Plan, Settings.**

### 1. Today (home screen)

- Header: date, a day-type toggle **Office / Home** (weekends get their own **Weekend** layout). Default is Office on Mon-Wed and Home on Thu-Fri; one tap changes today only. Default days are editable in Settings.
- A short **quote or scripture verse of the day** (see Motivation below).
- **Streak** shown small and friendly.
- **Checklist** for the day, in time order, each item one tap to tick:

  Home day
  - 6:00 Water on waking (500 ml)
  - 7:30 Breakfast: 2 boiled eggs, soaked almonds, 1 fruit
  - 7:30 Multivitamin + CoQ10
  - 12:00 Lunch shake (Vega + milk) and a fruit
  - 12:10 Walk
  - 3:00 Snack (curd and fruit, roasted chana, or a boiled egg)
  - 6:00 Psyllium in a full glass of water
  - 6:30 Dinner (show tonight's dish from the dinner rotation)
  - 7:45 Today's workout (links to the Workout tab; ticks itself when the workout is finished)
  - Night: soak almonds for tomorrow

  Office day: same items, but breakfast is "at desk", the lunch shake uses the packed shake kit, and the night item becomes "Pack for tomorrow: eggs, almonds, fruit, shake kit, snack, water bottle".

  Weekend: water, breakfast, supplements, psyllium, dinner, long walk, and on Sunday a link to the Sunday prep checklist.

- **Water taps:** a row of 12 drops/glasses, 250 ml each, target 3 L. Tap to fill, tap again to undo.
- Checklist items must be editable in Settings (add, rename, remove, reorder), because my routine will change. For example, I've paused my chia soak for now and may bring it back.
- When everything is ticked, show a small, calm celebration. Nothing loud.

### 2. Workout

Principle: **showing up is the win.** Every workout comes in three sizes, and the smallest one counts fully toward the streak.

- **Quick** (5-10 min), **Standard** (15-20 min), **Full** (30+ min). I pick the size when I start. Default to Quick for the first four weeks.
- A workout is just a **list I tick off**. No forced timers, no step-by-step walkthrough. A finish button at the end, with a satisfying completion animation.
- Optional, unobtrusive fields: weight used (strength) or minutes and distance (bike). Never required.

Starting weekly plan (editable in Settings):

| Day | Session |
|---|---|
| Mon-Wed (office) | Walk only. Optional bonus: 1 round of the kettlebell circuit |
| Thursday | Kettlebell circuit |
| Friday | Easy bike (fine to do while watching TV) |
| Saturday | Barbell basics, then a long walk |
| Sunday | Long walk, Sunday prep, rest |

Workout library:

- **Kettlebell circuit** (20 lb bell, both hands). One round:
  5 rows, 5 cleans, 5 swings, 5 goblet squats, 5 bicep curls, 5 tricep extensions, 5 pullovers, 10 alternating halos, 10 pushups.
  Quick = 1 round, Standard = 2-3 rounds, Full = 4-5 rounds. Show a round counter.
- **Easy bike:** Quick 10 min, Standard 20 min, Full 30 min, conversational pace.
- **Barbell basics:** squat, bench press, barbell row. Quick = 1 set of 8-10 each, Standard = 2 sets, Full = 3 sets plus a plank. Start light; remember the last weight used and show it next time.
- **Walk:** tick-off only, optional steps or minutes.

Each exercise gets a one-line plain-language form cue (write these yourself, short and safe). Let me add or edit workouts and exercises in Settings.

Habit rules:

- Streak counts days where the planned activity (workout or walk) was done at any size. Rest days don't break it.
- "Never miss twice": after one missed day, show a kind nudge, not a broken-streak message. No guilt language anywhere in the app.
- After two or three consistent weeks, **suggest** (never force) adding a round or moving from Quick to Standard.
- Small badges: first workout, first full week, 10 workouts, 25 workouts, first 1 kg lost, 5 kg lost.

### 3. Progress

- **Weekly weigh-in** (default Saturday morning, changeable). One number entry in kg. Don't prompt daily.
- Simple trend line from starting weight to now, with the target line to 85 kg by 31 March 2027, and a plain sentence such as "On pace" or "A little behind, and that's okay".
- This week at a glance: workouts done, walks, water average, checklist completion.
- Badges earned.
- Keep it to one calm scrollable page. No dashboards full of charts.

### 4. Plan (reference pages, read-only for v1)

- **Dinner rotation** (7 days): chole with roti and salad; palak or matar paneer with roti; dal tadka with egg bhurji and roti; rajma with a small rice portion and salad; paneer or tofu tikka with sautéed vegetables; egg curry (chicken optional); moong dal khichdi with raita.
- **Sunday prep checklist** (tickable, resets each week): boil 10-12 eggs; pressure-cook two legumes; pot of plain dal; hung curd; marinate paneer or tofu; soak moong for sprouts; onion-tomato masala cubes; protein atta mix (3 parts atta, 1 part besan or soy flour); chilla batter; chop salad vegetables; shake kits for office days; snack jars; soak almonds.
- **Psyllium rules:** 1 tsp in at least 250 ml water, drink straight away, never dry, keep 2+ hours from supplements and medicines, drink plenty of water through the day.
- **Protein cheat sheet:** rough protein per serving for paneer, Greek yogurt or hung curd, tofu, soya chunks, besan chilla, chana or rajma, dal, sprouts, eggs, Vega scoop.
- **Daily targets:** protein about 100 g, water about 3 L, sleep 7-9 hours.

### 5. Settings

- Default office days, weigh-in day, weight target and date.
- Edit checklist items, weekly workout plan, workouts and exercises.
- Reminders (see below).
- Export / Import data.
- Motivation: toggle quotes, toggle scripture verses.

## Reminders (keep this simple)

No push notifications and no server. Instead:

- A **"Add reminders to my calendar"** button that generates an `.ics` file of recurring events with alerts, which I add to my iPhone Calendar in one go. Suggested set, each individually selectable before export:
  - Water nudges at 10:00 am and 2:00 pm, weekdays
  - Psyllium at 6:00 pm, daily
  - Workout at 7:45 pm on workout days
  - Soak almonds / pack for tomorrow at 9:00 pm
  - Weigh-in, Saturday 7:00 am
  - Sunday prep, Sunday 10:00 am
- Give the events short, encouraging titles (for example "Psyllium time. Full glass of water" or "10 minutes is enough. Kettlebell?").
- Test that the `.ics` import works from a home-screen web app on current iOS. If it's unreliable, fall back to a Settings page that lists the reminders with clear steps for adding them in the Reminders app, and tell me.

## Motivation

- Rotate one message per day on the Today screen and one on the workout-complete screen.
- Mix **short encouraging lines** (write original ones, warm and steady in tone, such as "You showed up. That's the habit.") with **scripture verses** on strength, perseverance, discipline and caring for the body.
- For verses, use a **public-domain translation** (World English Bible or KJV) and show the reference. Suggested starting set: Philippians 4:13; Isaiah 40:31; Joshua 1:9; Galatians 6:9; Hebrews 12:11; 1 Corinthians 9:24-27; 1 Corinthians 6:19-20; 2 Timothy 1:7; Proverbs 16:3; Colossians 3:23; Psalm 28:7; Lamentations 3:22-23. Add more in the same spirit, about 30 in total.
- Keep the list in a data file so I can add my own.

## Not in version 1

Food or calorie logging, macros, recipes, barcode scanning, rest timers, guided workout walkthroughs, push notifications, cloud sync, multiple users. Structure the data so foods and amounts could be logged in a later version, but build none of it now.

## How to work

1. Start by showing me a short plan: stack, file structure, data model, and a text sketch of each screen. Wait for my go-ahead.
2. Build Today and Workout first so I can start using it, then Progress, Plan, Settings and reminders.
3. Test on a phone-sized viewport as you go. Check the install-to-home-screen flow and offline use.
4. Write a short README covering how to run it locally, how to deploy to GitHub Pages, how to install it on my iPhone, and how to edit the plan data.
5. Ask me whenever something here is unclear, instead of guessing.
