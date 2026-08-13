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
- Everything persists in `localStorage` — no backend required.

## Files

- `index.html` — screens and modals (companion picker, customize screen,
  focus room, shop, tasks, stats, reward popup).
- `css/style.css` — warm, flat-cutout visual theme.
- `js/companions.js` — animal and Kids Mode rosters, customization options
  (palettes, sizes, ages, temperaments), and the SVG armchair/character
  renderers.
- `js/app.js` — timer logic, rewards, shop, tasks, customization, and
  persistence.

## Notes

The companion illustrations and "Companion on Chair" branding here are
original to this project. The bold-outline, flat-cutout look is a general
animation *style* choice (thick outlines, oversized eyes, simple flat
shapes) — the specific characters, names, and artwork are original, not
reused from any third-party show or app. Likewise, Kids Mode's blocky
mini-figures are an original design in the general "blocky voxel avatar"
genre shared by many games — not a recreation of any specific game's
characters, name, or branding.
