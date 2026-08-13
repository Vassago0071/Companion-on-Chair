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

- **5 companions** to choose from, each an inline SVG sitting on a shared
  cozy armchair, drawn in a bold-outline, flat-cutout style: Momo (cat),
  Biscuit (corgi), Ember (fox), Sage (owl), Clover (bunny). Switch
  companions anytime.
- **Kids Mode**: swap the animal roster for 5 original blocky mini-figure
  characters (Robo, Scout, Captain Pip, Blaze, Shieldy) — an original take
  on the "blocky voxel avatar" genre, not a recreation of any specific
  game's characters or branding. Toggle from the top bar.
- **Customization** at pick-time (and anytime after via the "Customize"
  button): color palette, size, age (young/adult/elder, with matching
  visual cues like blush cheeks or glasses), and temperament
  (calm/playful/grumpy/sleepy, which changes their expression and idle
  animation pace).
- **Pomodoro mode** (15/25/45/60 min) and **count-up (flowtime) mode**.
- **Rewards**: finishing a session earns a random gift and fish; giving up
  early only nets virtual trash and no fish.
- **Shop**: spend fish on room decor (rugs, plants, lamps, etc.) that appears
  around your companion.
- **Task list**: add tasks and mark one as the active focus for the session,
  shown as a banner in the room.
- **Stats**: sessions completed, total focus minutes, day streak, gifts
  received.
- **Classroom Mode**: a teacher signs in with Google, hosts one or more named
  classes (each with its own short join code), and reopens any of them
  anytime from **My Classes** — points and rosters persist across sessions
  and devices tied to that Google account. Students join anonymously with
  just a code and a name, bringing their own companion. The whole class is
  visible to everyone in a live-updating leaderboard (points sorted
  descending) for friendly competitive bragging. The teacher can award (or
  remove) points to any student in real time; students spend those points in
  a **class-scoped shop** — separate from their personal fish/decor — so
  purchases only ever apply within that teacher's class. Each class also has
  a **room theme** (a few preset background palettes the teacher picks, seen
  live by every student) and a **class timer** — a shared Pomodoro countdown
  that lives in Firestore, not in the teacher's browser, so it keeps running
  for students exactly the same whether or not the teacher's tab stays open.
  Requires a Firebase project to sync across devices; see "Classroom Mode
  setup" below.
- Everything else persists in `localStorage` — no backend required.

## Files

- `index.html` — screens and modals (companion picker, customize screen,
  focus room, shop, tasks, stats, reward popup, Classroom Mode screens).
- `css/style.css` — warm, flat-cutout visual theme.
- `js/companions.js` — animal and Kids Mode rosters, customization options
  (palettes, sizes, ages, temperaments), and the SVG armchair/character
  renderers.
- `js/app.js` — timer logic, rewards, shop, tasks, customization, and
  persistence.
- `js/firebase-config.js` — where you paste your own Firebase project's
  config to enable Classroom Mode (placeholder by default).
- `js/classroom.js` — Classroom Mode: Firebase glue (auth, Firestore
  reads/writes/listeners) plus the teacher/student dashboard UI.
- `firestore.rules` — reference Firestore security rules for Classroom Mode;
  paste into your Firebase project's Firestore → Rules tab.

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
reused from any third-party show or app. Likewise, Kids Mode's blocky
mini-figures are an original design in the general "blocky voxel avatar"
genre shared by many games — not a recreation of any specific game's
characters, name, or branding.
