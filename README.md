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

- **5 companions** to choose from, each hand-drawn as inline SVG sitting on a
  shared chair: Momo (cat), Biscuit (corgi), Ember (fox), Sage (owl), Clover
  (bunny). Switch companions anytime.
- **Pomodoro mode** (15/25/45/60 min) and **count-up (flowtime) mode**.
- **Rewards**: finishing a session earns a random gift and fish; giving up
  early only nets virtual trash and no fish.
- **Shop**: spend fish on room decor (rugs, plants, lamps, etc.) that appears
  around your companion.
- **Task list**: add tasks and mark one as the active focus for the session,
  shown as a banner in the room.
- **Stats**: sessions completed, total focus minutes, day streak, gifts
  received.
- Everything persists in `localStorage` — no backend required.

## Files

- `index.html` — screens and modals (companion picker, focus room, shop,
  tasks, stats, reward popup).
- `css/style.css` — warm, hand-drawn-feeling visual theme.
- `js/companions.js` — companion roster + the SVG chair/character renderer.
- `js/app.js` — timer logic, rewards, shop, tasks, and persistence.

## Notes

The companion illustrations and the "Focus Companion" branding here are
original to this project — they don't reuse artwork, names, or assets from
any third-party app.
