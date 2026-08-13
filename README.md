# Companion on Chair

A browser-based focus timer inspired by "cat on chair"-style companion apps,
generalized to a choice of **5 original companions** instead of just a cat.
No build step or dependencies — open `index.html` in a browser, or serve the
folder statically.

## Run it

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## What's included

- **15 companions** to choose from, all in one roster, each an inline SVG
  sitting on a shared cozy armchair, drawn in a bold-outline, flat-cutout
  style:
  - **5 animals** — Momo (cat), Biscuit (corgi), Ember (fox), Sage (owl),
    Clover (bunny).
  - **5 blocky mini-figures** — Robo, Scout, Captain Pip, Rally, Shieldy —
    an original take on the "blocky voxel avatar" genre, not a recreation
    of any specific game's characters or branding.
  - **5 superhero archetypes** — Blaze, Voltway, Frostbyte, Terra, Nova
    Belle — original caped characters with elemental/cosmic powers (a
    generic trope shared across countless properties), each with their own
    name, costume, and color scheme. Not a recreation of any specific
    existing superhero.
  Switch companions anytime.
- **Customization** at pick-time (and anytime after via the "Customize"
  button): color palette, size, age (young/adult/elder, with matching
  visual cues like blush cheeks or glasses), temperament
  (calm/playful/grumpy/sleepy, which changes their expression and idle
  animation pace), and a chair color for the shared armchair itself.
- **Pomodoro mode** (15/25/45/60 min) and **count-up (flowtime) mode**.
- **Rewards**: finishing a session earns a random gift and fish; giving up
  early only nets virtual trash and no fish.
- **Shop**: spend fish on room decor (rugs, plants, lamps, etc.) or on
  **accessories** (hats, glasses, sunglasses, earrings, hairclips/bows,
  haircuts, eye colors, necklaces, scarves, ties, shoes — dozens of items)
  that equip onto whichever companion is active.
- **Task list**: add tasks and mark one as the active focus for the session,
  shown as a banner in the room.
- **Stats**: sessions completed, total focus minutes, day streak, gifts
  received.
- **Classroom Mode**: a teacher signs in with Google, hosts one or more named
  classes (each with its own short join code), and reopens any of them
  anytime from **My Classes** — points and rosters persist across sessions
  and devices tied to that Google account. Students join anonymously with
  just a code and a name, bringing their own companion — and that companion
  and its look stay locked to that class from then on, so a student can run
  a different character per class to track progress in each independently
  (switching your personal companion elsewhere doesn't touch a class you've
  already joined). The whole class is visible to everyone in a live-updating
  leaderboard (points sorted descending) for friendly competitive bragging.
  Instead of one flat point count, the teacher scores each student across
  **six bars** — Attention, Engagement, Completion of Work, Obedience,
  Friendliness, and Bonus (which requires a short reason each time, logged
  to a bonus history) — opened from a student's roster card; a student can
  view their own six bars read-only. Total class points (the leaderboard
  and shop currency) is always the sum of the six. Students spend those
  points in a **class-scoped shop** — decor and accessories, separate from
  personal fish/decor/accessories — so purchases only ever apply within that
  teacher's class. Each class also has a **room theme** (preset background
  palettes the teacher picks, seen live by every student), a **class timer**
  — Pomodoro presets or any custom length in minutes, since not every class
  starts on schedule — that lives in Firestore, not in the teacher's
  browser, so it keeps running for students exactly the same whether or not
  the teacher's tab stays open — and **Lesson Materials**: the teacher can
  type notes/homework and upload files (PPTs, PDFs, images, docs) that every
  student sees live on their dashboard, with a direct download link for each
  file.
  The teacher also has their own identity: a **Teacher Avatar** picked from
  4 original professional characters (2 coded male, 2 coded female), with
  age, hair style, hair color, and skin color options, shown to students as
  "Hosted by ..." on their class dashboard. The choice carries forward as
  the default for the next class hosted.
  Requires a Firebase project to sync across devices; see "Classroom Mode
  setup" below.
- Everything else persists in `localStorage` — no backend required.

## Files

- `index.html` — screens and modals (companion picker, customize screen,
  focus room, shop, tasks, stats, reward popup, Classroom Mode screens).
- `css/style.css` — warm, flat-cutout visual theme.
- `js/companions.js` — the animal, blocky-avatar, and superhero rosters,
  customization options (palettes, sizes, ages, temperaments), and the SVG
  armchair/character renderers.
- `js/app.js` — timer logic, rewards, shop, tasks, customization, and
  persistence.
- `js/firebase-config.js` — where you paste your own Firebase project's
  config to enable Classroom Mode (placeholder by default).
- `js/classroom.js` — Classroom Mode: Firebase glue (auth, Firestore
  reads/writes/listeners, Storage uploads) plus the teacher/student
  dashboard UI.
- `firestore.rules` — reference Firestore security rules for Classroom Mode;
  paste into your Firebase project's Firestore → Rules tab.
- `storage.rules` — reference Storage security rules for Lesson Materials
  file uploads; paste into your Firebase project's Storage → Rules tab.

## Classroom Mode setup

Classroom Mode needs a real backend to sync points and rosters across
different students' devices, so it uses Firebase: Firestore for data, plus
two Auth providers — **Google Sign-In** for teachers (so their classes
persist and follow them across devices) and **Anonymous Auth** for students
(no account needed, just a code and a name). Without it configured, the
Classroom screen shows a setup notice and the rest of the app works exactly
as before.

1. Create a free project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Firestore Database → Create database** (production mode is fine
   — the rules below lock it down).
3. **Build → Authentication → Sign-in method** → enable both **Google** and
   **Anonymous**.
4. **Project settings → General → Your apps → Add app → Web** → register it,
   then copy the `firebaseConfig` object it gives you into
   `js/firebase-config.js` (`FIREBASE_CONFIG`).
5. **Firestore Database → Rules** → paste in the contents of
   `firestore.rules` at the repo root → Publish.

That's it — reload the app and "Host a Class" / "Join a Class" will be
enabled. See the comments in `firestore.rules` for what the rules do and
their one known limitation (purchase amounts aren't validated
server-side without a Cloud Function — fine for a classroom-trust setting).

## Notes

The companion illustrations and "Companion on Chair" branding here are
original to this project. The bold-outline, flat-cutout look is a general
animation *style* choice (thick outlines, oversized eyes, simple flat
shapes) — the specific characters, names, and artwork are original, not
reused from any third-party show or app. Likewise, the blocky mini-figures
are an original design in the general "blocky voxel avatar" genre shared by
many games, and the superhero characters are an original take on the
elemental/caped-hero archetype — neither set recreates any specific
existing game's or franchise's characters, names, or branding.
