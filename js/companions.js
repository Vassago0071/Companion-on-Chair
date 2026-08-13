/* Companion roster + South-Park-inspired SVG renderer: thick black outlines,
   oversized round eyes, flat cutout-paper shapes. All character designs
   below are original to this project, not artwork from any third-party show
   or app — only the general cutout-animation *style* is referenced. */

const COMPANIONS = [
  {
    id: "cat",
    name: "Momo",
    species: "Cat",
    kind: "animal",
    tagline: "A calm tabby who purrs while you type.",
    colors: { body: "#e8935a", belly: "#fff3e2", accent: "#c96f36" },
  },
  {
    id: "dog",
    name: "Biscuit",
    species: "Corgi",
    kind: "animal",
    tagline: "An eager pup who guards your deadlines.",
    colors: { body: "#e9b976", belly: "#fff8ec", accent: "#c98a3a" },
  },
  {
    id: "fox",
    name: "Ember",
    species: "Fox",
    kind: "animal",
    tagline: "A quiet fox that keeps one eye on the clock.",
    colors: { body: "#e8683f", belly: "#fff6ee", accent: "#a83e22" },
  },
  {
    id: "owl",
    name: "Sage",
    species: "Owl",
    kind: "animal",
    tagline: "A night-shift owl who never seems to blink.",
    colors: { body: "#8d7a9e", belly: "#f1ecf7", accent: "#5e4c72" },
  },
  {
    id: "bunny",
    name: "Clover",
    species: "Bunny",
    kind: "animal",
    tagline: "A soft-footed bunny who thumps when the timer ends.",
    colors: { body: "#f4c9d6", belly: "#fff5f8", accent: "#d98ba3" },
  },
];

/* Kids Mode roster: original blocky mini-figure characters (cylinder head,
   block body — the general "voxel avatar" genre shared by many building
   games) with entirely original names, outfits and colors. Not a
   recreation of any specific game's characters or branding. */
const KID_AVATARS = [
  {
    id: "robo",
    name: "Robo",
    species: "Robot",
    kind: "avatar",
    tagline: "A friendly little robot who beeps encouragement.",
    colors: { primary: "#8fa3ad", secondary: "#5c6b73", head: "#c7d3d8", trim: "#2f3b40" },
  },
  {
    id: "scout",
    name: "Scout",
    species: "Explorer",
    kind: "avatar",
    tagline: "Always ready for the next quest — or the next task.",
    colors: { primary: "#5b8c5a", secondary: "#3f5c3a", head: "#f2c9a0", trim: "#2e4029" },
  },
  {
    id: "captain",
    name: "Captain Pip",
    species: "Voyager",
    kind: "avatar",
    tagline: "Sails a desk instead of the seven seas.",
    colors: { primary: "#a8332c", secondary: "#3a2c22", head: "#f2c9a0", trim: "#7a231d" },
  },
  {
    id: "rally",
    name: "Rally",
    species: "Athlete",
    kind: "avatar",
    tagline: "Treats every Pomodoro like a game to win.",
    colors: { primary: "#2b6fb0", secondary: "#26344a", head: "#f2c9a0", trim: "#d94f3d" },
  },
  {
    id: "shieldy",
    name: "Shieldy",
    species: "Knight",
    kind: "avatar",
    tagline: "Guards your focus like a castle gate.",
    colors: { primary: "#c9a227", secondary: "#8a6c1c", head: "#c9a227", trim: "#6e4b0e" },
  },
];

/* Superhero-archetype roster: original caped characters (elemental/cosmic
   powers — a generic trope shared across countless properties) with their
   own original names, costumes, and color schemes. Not a recreation of any
   specific existing superhero's likeness, name, or branding. */
const HERO_AVATARS = [
  {
    id: "blaze",
    name: "Blaze",
    species: "Ember",
    kind: "avatar",
    tagline: "Flies in on a trail of fire when focus time starts.",
    colors: { primary: "#e8452f", secondary: "#3a1f1a", head: "#f2c9a0", trim: "#ffb347" },
  },
  {
    id: "voltway",
    name: "Voltway",
    species: "Storm",
    kind: "avatar",
    tagline: "Moves at lightning speed between tasks.",
    colors: { primary: "#f0c419", secondary: "#2b2b52", head: "#f2c9a0", trim: "#4fc3f7" },
  },
  {
    id: "frostbyte",
    name: "Frostbyte",
    species: "Frost",
    kind: "avatar",
    tagline: "Keeps a cool head through the longest sessions.",
    colors: { primary: "#aee3f5", secondary: "#2c4a5e", head: "#f2c9a0", trim: "#ffffff" },
  },
  {
    id: "terra",
    name: "Terra",
    species: "Earth",
    kind: "avatar",
    tagline: "Unshakeable focus, rock solid.",
    colors: { primary: "#6a9c5c", secondary: "#5b3a22", head: "#f2c9a0", trim: "#b5651d" },
  },
  {
    id: "nova",
    name: "Nova Belle",
    species: "Cosmic",
    kind: "avatar",
    tagline: "Focus that's out of this world.",
    colors: { primary: "#8d5fd3", secondary: "#2c1f4a", head: "#f2c9a0", trim: "#ff6fae" },
  },
];

/* Every companion, animal or avatar, available together in one roster. */
const ALL_COMPANIONS = [...COMPANIONS, ...KID_AVATARS, ...HERO_AVATARS];

function getCompanion(id) {
  return ALL_COMPANIONS.find((c) => c.id === id) || ALL_COMPANIONS[0];
}

/** Dispatches to the right renderer based on the companion's kind. */
function renderCompanionArt(companion, state, custom) {
  return companion.kind === "avatar" ? avatarSVG(companion, state, custom) : companionSVG(companion, state, custom);
}

/* Customization options, shared across all species. */
const PALETTES = [
  { id: "classic", name: "Classic" },
  { id: "charcoal", name: "Charcoal", colors: { body: "#5b5a5c", belly: "#e8e6e6", accent: "#2f2e30" } },
  { id: "snow", name: "Snow", colors: { body: "#f2f1ee", belly: "#ffffff", accent: "#c9c6c2" } },
  { id: "autumn", name: "Autumn", colors: { body: "#b5651d", belly: "#fbe8d3", accent: "#7a4212" } },
  { id: "midnight", name: "Midnight", colors: { body: "#4b3f72", belly: "#e4dcf5", accent: "#2c2350" } },
];

const SIZES = [
  { id: "small", label: "Small", scale: 0.82 },
  { id: "medium", label: "Medium", scale: 1 },
  { id: "large", label: "Large", scale: 1.18 },
];

const AGES = [
  { id: "young", label: "Young" },
  { id: "adult", label: "Adult" },
  { id: "elder", label: "Elder" },
];

const TEMPERAMENTS = [
  { id: "calm", label: "Calm", icon: "😌" },
  { id: "playful", label: "Playful", icon: "😄" },
  { id: "grumpy", label: "Grumpy", icon: "😠" },
  { id: "sleepy", label: "Sleepy", icon: "😴" },
];

/* Hair isn't independently colorable — character color already covers that. */
const DEFAULT_HAIR_COLOR = "#5b3a22";

const CHAIR_COLORS = [
  { id: "blue", label: "Blue", body: "#3b5f92", cushion: "#5b82b8", tuft: "#24406b", blanket: "#b9c9dc" },
  { id: "blush", label: "Blush", body: "#b8637a", cushion: "#d492a8", tuft: "#8a3f56", blanket: "#f0c3d1" },
  { id: "sage", label: "Sage", body: "#5c7a52", cushion: "#82a374", tuft: "#3f5c37", blanket: "#c3d9b8" },
  { id: "charcoal", label: "Charcoal", body: "#4a4a4d", cushion: "#6b6b6f", tuft: "#2c2c2e", blanket: "#c9c8ca" },
  { id: "mustard", label: "Mustard", body: "#c98f2b", cushion: "#e0ac4c", tuft: "#8f5f16", blanket: "#f0d9a3" },
];

function defaultCustomization() {
  return {
    colorId: "classic",
    sizeId: "medium",
    ageId: "adult",
    temperamentId: "calm",
    chairColorId: "blue",
    accessories: {},
  };
}

/* Class-shop accessory catalog (purchased with class points in Classroom
 * Mode — see classroom.js). Each item slots into one of a handful of
 * generic attach zones shared by every companion's shared coordinate
 * system, so one render function per item works across the whole roster.
 * `render` optionally receives a hair color (used by "haircut" items). */
const ACCESSORY_CATALOG = [
  {
    id: "hat-tophat",
    slot: "hat",
    zone: "head",
    name: "Top Hat",
    icon: "🎩",
    price: 10,
    render: () => `<path class="ol" d="M116 42 L164 42 L164 32 L116 32 Z" fill="#221a15"/><rect class="ol" x="125" y="8" width="30" height="28" rx="3" fill="#221a15"/>`,
  },
  {
    id: "hat-party",
    slot: "hat",
    zone: "head",
    name: "Party Hat",
    icon: "🎉",
    price: 8,
    render: () => `<path class="ol" d="M140 6 L120 40 L160 40 Z" fill="#e8452f"/><circle class="ol" cx="140" cy="6" r="4" fill="#f0c419"/>`,
  },
  {
    id: "glasses-round",
    slot: "glasses",
    zone: "head",
    name: "Round Glasses",
    icon: "👓",
    price: 6,
    render: () => `<g class="glasses"><circle cx="122" cy="88" r="15"/><circle cx="158" cy="88" r="15"/><line x1="137" y1="86" x2="143" y2="86"/></g>`,
  },
  {
    id: "glasses-star",
    slot: "glasses",
    zone: "head",
    name: "Star Glasses",
    icon: "🌟",
    price: 8,
    render: () =>
      `<g class="glasses" style="stroke:#e8788a"><circle cx="122" cy="88" r="15"/><circle cx="158" cy="88" r="15"/><line x1="137" y1="86" x2="143" y2="86"/></g>`,
  },
  {
    id: "glasses-sunglasses",
    slot: "glasses",
    zone: "head",
    name: "Sunglasses",
    icon: "🕶️",
    price: 7,
    render: () =>
      `<g class="ol"><ellipse cx="122" cy="88" rx="15" ry="12" fill="#18110b"/><ellipse cx="158" cy="88" rx="15" ry="12" fill="#18110b"/><line x1="137" y1="86" x2="143" y2="86" stroke="#18110b" stroke-width="3"/></g>`,
  },
  {
    id: "earring-hoop",
    slot: "earring",
    zone: "head",
    name: "Gold Hoop",
    icon: "💍",
    price: 5,
    render: () => `<circle class="ol" cx="106" cy="100" r="6" fill="none" stroke="#e8c873" stroke-width="3"/>`,
  },
  {
    id: "hairclip-bow",
    slot: "hairclip",
    zone: "head",
    name: "Pink Bow",
    icon: "🎀",
    price: 5,
    render: () =>
      `<path class="ol" d="M158 50 L172 42 L172 58 Z" fill="#e8788a"/><path class="ol" d="M158 50 L144 42 L144 58 Z" fill="#e8788a"/><circle class="ol" cx="158" cy="50" r="4" fill="#c96f8a"/>`,
  },
  {
    id: "hairclip-bow-blue",
    slot: "hairclip",
    zone: "head",
    name: "Blue Bow",
    icon: "🎀",
    price: 5,
    render: () =>
      `<path class="ol" d="M158 50 L172 42 L172 58 Z" fill="#4a7fc9"/><path class="ol" d="M158 50 L144 42 L144 58 Z" fill="#4a7fc9"/><circle class="ol" cx="158" cy="50" r="4" fill="#356099"/>`,
  },
  {
    id: "hairclip-bow-yellow",
    slot: "hairclip",
    zone: "head",
    name: "Yellow Bow",
    icon: "🎀",
    price: 5,
    render: () =>
      `<path class="ol" d="M158 50 L172 42 L172 58 Z" fill="#f0c419"/><path class="ol" d="M158 50 L144 42 L144 58 Z" fill="#f0c419"/><circle class="ol" cx="158" cy="50" r="4" fill="#c99f14"/>`,
  },
  {
    id: "hairclip-bow-purple",
    slot: "hairclip",
    zone: "head",
    name: "Purple Bow",
    icon: "🎀",
    price: 5,
    render: () =>
      `<path class="ol" d="M158 50 L172 42 L172 58 Z" fill="#8d5fd3"/><path class="ol" d="M158 50 L144 42 L144 58 Z" fill="#8d5fd3"/><circle class="ol" cx="158" cy="50" r="4" fill="#6c46a8"/>`,
  },
  {
    id: "haircut-spiky",
    slot: "haircut",
    zone: "head",
    name: "Spiky Hair",
    icon: "💇",
    price: 8,
    render: (hairColor) =>
      `<path class="ol" d="M112 60 L118 28 L126 52 L134 20 L140 50 L146 20 L154 52 L162 28 L168 60 Z" fill="${hairColor}"/>`,
  },
  {
    id: "haircut-long",
    slot: "haircut",
    zone: "head",
    name: "Long Hair",
    icon: "💁",
    price: 8,
    render: (hairColor) =>
      `<path class="ol" d="M108 62 Q104 100 112 130 L124 130 Q116 90 118 62 Z" fill="${hairColor}"/><path class="ol" d="M172 62 Q176 100 168 130 L156 130 Q164 90 162 62 Z" fill="${hairColor}"/><path class="ol" d="M110 60 Q110 34 140 32 Q170 34 170 60 L162 60 Q162 44 140 44 Q118 44 118 60 Z" fill="${hairColor}"/>`,
  },
  { id: "eyecolor-blue", slot: "eyecolor", zone: "eyes", name: "Blue Eyes", icon: "🔵", price: 4, eyeColor: "#3a7bd5" },
  { id: "eyecolor-green", slot: "eyecolor", zone: "eyes", name: "Green Eyes", icon: "🟢", price: 4, eyeColor: "#4a9c5c" },
  { id: "eyecolor-violet", slot: "eyecolor", zone: "eyes", name: "Violet Eyes", icon: "🟣", price: 4, eyeColor: "#8d5fd3" },
  { id: "eyecolor-amber", slot: "eyecolor", zone: "eyes", name: "Amber Eyes", icon: "🟠", price: 4, eyeColor: "#c9902b" },
  { id: "eyecolor-hazel", slot: "eyecolor", zone: "eyes", name: "Hazel Eyes", icon: "🟤", price: 4, eyeColor: "#8a6c3f" },
  { id: "eyecolor-gray", slot: "eyecolor", zone: "eyes", name: "Gray Eyes", icon: "⚪", price: 4, eyeColor: "#8a8a8a" },
  {
    id: "necklace-chain",
    slot: "necklace",
    zone: "torso",
    name: "Gold Chain",
    icon: "📿",
    price: 6,
    render: () =>
      `<path d="M118 120 Q140 132 162 120" fill="none" stroke="#e8c873" stroke-width="4"/><circle class="ol" cx="140" cy="130" r="5" fill="#e8c873"/>`,
  },
  {
    id: "scarf-red",
    slot: "scarf",
    zone: "torso",
    name: "Red Scarf",
    icon: "🧣",
    price: 6,
    render: () =>
      `<path class="ol" d="M104 118 Q140 132 176 118 L176 130 Q140 144 104 130 Z" fill="#c9432f"/><path class="ol" d="M150 128 L158 160 L142 160 Z" fill="#c9432f"/>`,
  },
  {
    id: "scarf-blue",
    slot: "scarf",
    zone: "torso",
    name: "Blue Scarf",
    icon: "🧣",
    price: 6,
    render: () =>
      `<path class="ol" d="M104 118 Q140 132 176 118 L176 130 Q140 144 104 130 Z" fill="#2b6fb0"/><path class="ol" d="M150 128 L158 160 L142 160 Z" fill="#2b6fb0"/>`,
  },
  {
    id: "scarf-green",
    slot: "scarf",
    zone: "torso",
    name: "Green Scarf",
    icon: "🧣",
    price: 6,
    render: () =>
      `<path class="ol" d="M104 118 Q140 132 176 118 L176 130 Q140 144 104 130 Z" fill="#4a9c5c" /><path class="ol" d="M150 128 L158 160 L142 160 Z" fill="#4a9c5c"/>`,
  },
  {
    id: "scarf-purple",
    slot: "scarf",
    zone: "torso",
    name: "Purple Scarf",
    icon: "🧣",
    price: 6,
    render: () =>
      `<path class="ol" d="M104 118 Q140 132 176 118 L176 130 Q140 144 104 130 Z" fill="#8d5fd3"/><path class="ol" d="M150 128 L158 160 L142 160 Z" fill="#8d5fd3"/>`,
  },
  {
    id: "tie-blue",
    slot: "tie",
    zone: "torso",
    name: "Blue Tie",
    icon: "👔",
    price: 5,
    render: () => `<path class="ol" d="M132 122 L148 122 L152 138 L140 168 L128 138 Z" fill="#2b6fb0"/>`,
  },
  {
    id: "tie-red",
    slot: "tie",
    zone: "torso",
    name: "Red Tie",
    icon: "👔",
    price: 5,
    render: () => `<path class="ol" d="M132 122 L148 122 L152 138 L140 168 L128 138 Z" fill="#c9432f"/>`,
  },
  {
    id: "tie-green",
    slot: "tie",
    zone: "torso",
    name: "Green Tie",
    icon: "👔",
    price: 5,
    render: () => `<path class="ol" d="M132 122 L148 122 L152 138 L140 168 L128 138 Z" fill="#4a9c5c"/>`,
  },
  {
    id: "tie-purple",
    slot: "tie",
    zone: "torso",
    name: "Purple Tie",
    icon: "👔",
    price: 5,
    render: () => `<path class="ol" d="M132 122 L148 122 L152 138 L140 168 L128 138 Z" fill="#8d5fd3"/>`,
  },
  {
    id: "shoes-red",
    slot: "shoes",
    zone: "torso",
    name: "Red Sneakers",
    icon: "👟",
    price: 5,
    render: () =>
      `<rect class="ol" x="80" y="206" width="30" height="12" rx="4" fill="#c9432f"/><rect class="ol" x="170" y="206" width="30" height="12" rx="4" fill="#c9432f"/>` +
      `<ellipse class="ol" cx="110" cy="184" rx="15" ry="11" fill="#c9432f" opacity="0.001"/>`,
  },
];

function getAccessory(id) {
  return ACCESSORY_CATALOG.find((a) => a.id === id) || null;
}

function equippedAccessoryItems(accessories) {
  return Object.values(accessories || {})
    .map((id) => getAccessory(id))
    .filter(Boolean);
}

function resolveColors(companion, colorId) {
  const palette = PALETTES.find((p) => p.id === colorId);
  return palette && palette.colors ? palette.colors : companion.colors;
}

function resolveAvatarColors(companion, colorId) {
  const c = companion.colors;
  const palette = PALETTES.find((p) => p.id === colorId);
  if (!palette || !palette.colors) return c;
  return { ...c, primary: palette.colors.body, secondary: palette.colors.accent };
}

/* Shared cozy armchair, drawn once and reused under every companion.
 * `chairColorId` picks a fabric palette from CHAIR_COLORS. */
function chairSVG(chairColorId) {
  const palette = CHAIR_COLORS.find((c) => c.id === chairColorId) || CHAIR_COLORS[0];
  return `
    <g class="chair">
      <rect class="ol" x="88" y="204" width="12" height="22" rx="4" fill="#7a5636"/>
      <rect class="ol" x="180" y="204" width="12" height="22" rx="4" fill="#7a5636"/>
      <ellipse class="ol" cx="64" cy="152" rx="34" ry="48" fill="${palette.body}"/>
      <ellipse class="ol" cx="216" cy="152" rx="34" ry="48" fill="${palette.body}"/>
      <rect class="ol" x="58" y="54" width="164" height="132" rx="44" fill="${palette.body}"/>
      <g class="tuft-button">
        <circle cx="112" cy="98" r="3" fill="${palette.tuft}"/>
        <circle cx="168" cy="98" r="3" fill="${palette.tuft}"/>
        <circle cx="140" cy="130" r="3" fill="${palette.tuft}"/>
      </g>
      <ellipse class="ol" cx="140" cy="182" rx="96" ry="34" fill="${palette.cushion}"/>
      <path class="ol" d="M206 142 L238 130 L240 178 L210 190 Z" fill="#f4ede0"/>
      <g class="blanket-check">
        <rect x="212" y="140" width="9" height="9" fill="${palette.blanket}"/>
        <rect x="226" y="135" width="9" height="9" fill="${palette.blanket}"/>
        <rect x="214" y="158" width="9" height="9" fill="${palette.blanket}"/>
        <rect x="228" y="153" width="9" height="9" fill="${palette.blanket}"/>
      </g>
    </g>
  `;
}

/* Species-specific ears/tail/nose/tuft layered onto a shared big-head base. */
function speciesFeatures(species, colors) {
  switch (species) {
    case "Cat":
      return {
        ears: `
          <path class="ol" d="M104 70 L86 22 L132 54 Z" fill="${colors.body}"/>
          <path class="ol" d="M176 70 L194 22 L148 54 Z" fill="${colors.body}"/>
          <path class="ol" d="M106 62 L96 30 L124 52 Z" fill="${colors.accent}"/>
          <path class="ol" d="M174 62 L184 30 L156 52 Z" fill="${colors.accent}"/>
        `,
        tuft: `<path class="ol" d="M124 46 L128 30 L134 44 L140 26 L146 44 L152 30 L156 46 Z" fill="${colors.body}"/>`,
        extra: `<path class="ol" d="M100 150 Q20 140 18 90 Q17 68 34 62 Q30 60 44 66 Q34 92 50 118 Q66 134 100 150 Z" fill="${colors.body}"/>`,
        nose: `<path class="ol" d="M132 100 L148 100 L140 111 Z" fill="#f28fa0"/>`,
        muzzle: `
          <g class="whisker-line">
            <path d="M96 104 L68 98"/>
            <path d="M96 111 L66 112"/>
            <path d="M96 118 L68 126"/>
            <path d="M184 104 L212 98"/>
            <path d="M184 111 L214 112"/>
            <path d="M184 118 L212 126"/>
          </g>`,
      };
    case "Corgi":
      return {
        ears: `
          <path class="ol" d="M100 66 Q88 24 122 34 Q116 58 118 70 Z" fill="${colors.body}"/>
          <path class="ol" d="M180 66 Q192 24 158 34 Q164 58 162 70 Z" fill="${colors.body}"/>
          <path class="ol" d="M104 60 Q98 34 116 40 Q112 56 112 64 Z" fill="${colors.belly}"/>
          <path class="ol" d="M176 60 Q182 34 164 40 Q168 56 168 64 Z" fill="${colors.belly}"/>
        `,
        extra: `<path class="ol" d="M92 116 Q140 100 188 116 Q188 144 140 152 Q92 144 92 116 Z" fill="${colors.belly}"/>`,
        nose: `<ellipse class="ol" cx="140" cy="104" rx="8" ry="6" fill="#4a2f1c"/>`,
      };
    case "Fox":
      return {
        ears: `
          <path class="ol" d="M102 68 L82 16 L134 54 Z" fill="${colors.body}"/>
          <path class="ol" d="M178 68 L198 16 L146 54 Z" fill="${colors.body}"/>
          <path class="ol" d="M104 58 L92 26 L120 50 Z" fill="#241c18"/>
          <path class="ol" d="M176 58 L188 26 L160 50 Z" fill="#241c18"/>
        `,
        extra: `
          <path class="ol" d="M100 152 Q10 130 16 78 Q34 90 52 84 Q42 112 68 136 Q84 146 100 152 Z" fill="${colors.body}"/>
          <ellipse class="ol" cx="26" cy="86" rx="9" ry="8" fill="${colors.belly}"/>
        `,
        nose: `<path class="ol" d="M133 100 L147 100 L140 110 Z" fill="#241c18"/>`,
      };
    case "Owl":
      return {
        ears: `
          <path class="ol" d="M110 66 Q98 30 118 34 Q124 30 128 40 Q116 46 118 68 Z" fill="${colors.body}"/>
          <path class="ol" d="M170 66 Q182 30 162 34 Q156 30 152 40 Q164 46 162 68 Z" fill="${colors.body}"/>
        `,
        extra: `<path d="M92 118 Q140 140 188 118 Q188 140 140 150 Q92 140 92 118 Z" fill="${colors.accent}" opacity="0.35"/>`,
        nose: `<path class="ol" d="M132 100 L148 100 L140 114 Z" fill="#e8a23a"/>`,
        eyeScale: 1.15,
      };
    case "Bunny":
      return {
        ears: `
          <path class="ol" d="M116 66 Q104 4 130 14 Q134 54 136 70 Z" fill="${colors.body}"/>
          <path class="ol" d="M164 66 Q176 4 150 14 Q146 54 144 70 Z" fill="${colors.body}"/>
          <path class="ol" d="M119 58 Q112 16 128 22 Q130 50 132 62 Z" fill="${colors.belly}"/>
          <path class="ol" d="M161 58 Q168 16 152 22 Q150 50 148 62 Z" fill="${colors.belly}"/>
        `,
        extra: `<circle class="ol" cx="88" cy="168" r="16" fill="${colors.belly}"/>`,
        nose: `<path class="ol" d="M135 100 L145 100 L140 108 Z" fill="#e8788a"/>`,
      };
    default:
      return { ears: "", extra: "", nose: "" };
  }
}

/**
 * Renders a companion sitting on the chair as an inline SVG string.
 * state: "idle" | "focus" | "sleep"
 * custom: { colorId, sizeId, ageId, temperamentId, chairColorId } — see defaultCustomization()
 */
function companionSVG(companion, state, custom) {
  const cust = Object.assign(defaultCustomization(), custom || {});
  const c = resolveColors(companion, cust.colorId);
  const f = speciesFeatures(companion.species, c);
  const blink = state === "sleep";
  const eyeScale = f.eyeScale || 1;
  const rx = 16 * eyeScale;
  const ry = 19 * eyeScale;

  const sizeScale = (SIZES.find((s) => s.id === cust.sizeId) || SIZES[1]).scale;
  const headScale = cust.ageId === "young" ? 1.14 : cust.ageId === "elder" ? 1.02 : 1;
  const torsoScale = cust.ageId === "young" ? 0.9 : cust.ageId === "elder" ? 1.04 : 1;

  const sleepy = cust.temperamentId === "sleepy";
  const grumpy = cust.temperamentId === "grumpy";
  const playful = cust.temperamentId === "playful";

  const equipped = equippedAccessoryItems(cust.accessories);
  const eyecolorItem = equipped.find((a) => a.slot === "eyecolor");
  const pupilColor = eyecolorItem ? eyecolorItem.eyeColor : "#18110b";
  const headAccessories = equipped
    .filter((a) => a.zone === "head" && a.slot !== "haircut")
    .map((a) => a.render())
    .join("");
  const torsoAccessories = equipped
    .filter((a) => a.zone === "torso")
    .map((a) => a.render())
    .join("");

  let eyes;
  if (blink) {
    eyes = `
      <path class="ol" d="M100 84 q18 12 36 0" stroke="#18110b" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path class="ol" d="M172 84 q18 12 36 0" stroke="#18110b" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  } else {
    eyes = `
      <ellipse class="ol" cx="118" cy="88" rx="${rx}" ry="${ry}" fill="#fff"/>
      <ellipse class="ol" cx="162" cy="88" rx="${rx}" ry="${ry}" fill="#fff"/>
      <circle cx="122" cy="84" r="5.5" fill="${pupilColor}"/>
      <circle cx="158" cy="84" r="5.5" fill="${pupilColor}"/>
      <circle cx="118" cy="79" r="2" fill="#fff"/>
      <circle cx="154" cy="79" r="2" fill="#fff"/>
    `;
    if (sleepy) {
      eyes += `
        <path d="M100 82 Q118 72 136 82 L136 90 Q118 84 100 90 Z" fill="${c.body}"/>
        <path d="M144 82 Q162 72 180 82 L180 90 Q162 84 144 90 Z" fill="${c.body}"/>
      `;
    }
  }

  const eyebrows = grumpy
    ? `<path class="mouth" d="M100 70 L132 79"/><path class="mouth" d="M180 70 L148 79"/>`
    : "";

  let mouth;
  if (grumpy) {
    mouth = `<path class="mouth" d="M126 124 Q140 114 154 124"/>`;
  } else if (playful) {
    mouth = `<path class="mouth" d="M120 115 Q140 136 160 115"/><ellipse cx="140" cy="124" rx="7" ry="6" fill="#e8788a" stroke="#18110b" stroke-width="2"/>`;
  } else {
    mouth = `<path class="mouth" d="M128 118 Q140 126 152 118"/>`;
  }

  const glasses =
    cust.ageId === "elder"
      ? `<g class="glasses"><circle cx="118" cy="88" r="19"/><circle cx="162" cy="88" r="19"/><line x1="136" y1="86" x2="144" y2="86"/><line x1="99" y1="83" x2="88" y2="79"/><line x1="181" y1="83" x2="192" y2="79"/></g>`
      : "";

  const blush =
    cust.ageId === "young"
      ? `<circle cx="98" cy="108" r="8" fill="#ffb3c0" opacity="0.55"/><circle cx="182" cy="108" r="8" fill="#ffb3c0" opacity="0.55"/>`
      : "";

  const sleepyZ = sleepy
    ? `<text x="184" y="44" font-size="20" fill="#8a7360" transform="rotate(-10 184 44)">z</text>
       <text x="198" y="28" font-size="14" fill="#8a7360" transform="rotate(-10 198 28)">z</text>`
    : "";

  return `
  <svg viewBox="0 0 240 230" class="companion-svg companion-${state} temperament-${cust.temperamentId}" xmlns="http://www.w3.org/2000/svg">
    <ellipse class="floor-shadow" cx="140" cy="222" rx="92" ry="9"/>
    ${chairSVG(cust.chairColorId)}
    <g transform="translate(140 222) scale(${sizeScale}) translate(-140 -222)">
      <g class="companion-body">
        <g transform="translate(140 150) scale(${torsoScale}) translate(-140 -150)">
          ${f.extra || ""}
          <ellipse class="ol" cx="140" cy="134" rx="58" ry="46" fill="${c.body}"/>
          <ellipse class="ol" cx="140" cy="150" rx="33" ry="27" fill="${c.belly}"/>
          <ellipse class="ol" cx="110" cy="180" rx="15" ry="11" fill="${c.body}"/>
          <ellipse class="ol" cx="170" cy="180" rx="15" ry="11" fill="${c.body}"/>
          ${torsoAccessories}
        </g>
        <g transform="translate(140 90) scale(${headScale}) translate(-140 -90)">
          ${f.ears}
          <circle class="ol" cx="140" cy="90" r="50" fill="${c.body}"/>
          ${f.tuft || ""}
          <ellipse class="ol" cx="140" cy="106" rx="31" ry="23" fill="${c.belly}"/>
          ${blush}
          ${eyes}
          ${eyebrows}
          ${glasses}
          ${f.nose || ""}
          ${mouth}
          ${f.muzzle || ""}
          ${sleepyZ}
          ${headAccessories}
        </g>
      </g>
    </g>
  </svg>`;
}

/* Species-specific hat/accessory + emblem for the blocky avatar roster. */
function avatarFeatures(species, colors) {
  switch (species) {
    case "Robot":
      return {
        headFill: colors.head,
        robotFace: true,
        headExtra: `
          <rect class="ol" x="136" y="42" width="8" height="18" fill="${colors.trim}"/>
          <circle class="ol" cx="140" cy="40" r="6" fill="${colors.trim}"/>
        `,
        torsoExtra: `<rect class="ol" x="122" y="132" width="36" height="14" rx="4" fill="${colors.trim}"/>`,
      };
    case "Explorer":
      return {
        headFill: colors.head,
        headExtra: `<path class="ol" d="M108 66 Q140 44 172 66 L172 76 Q140 60 108 76 Z" fill="${colors.trim}"/>`,
        torsoExtra: `
          <path class="ol" d="M104 122 L124 160" stroke="${colors.trim}" stroke-width="6" fill="none" stroke-linecap="round"/>
          <path class="ol" d="M176 122 L156 160" stroke="${colors.trim}" stroke-width="6" fill="none" stroke-linecap="round"/>
        `,
      };
    case "Voyager":
      return {
        headFill: colors.head,
        headExtra: `<path class="ol" d="M104 62 Q140 30 176 62 Q160 50 140 54 Q120 50 104 62 Z" fill="${colors.trim}"/>`,
        torsoExtra: `<rect class="ol" x="130" y="150" width="20" height="14" rx="3" fill="${colors.trim}"/>`,
      };
    case "Athlete":
      return {
        headFill: colors.head,
        headExtra: `
          <path class="ol" d="M106 64 Q140 38 174 64 Q174 54 140 50 Q106 54 106 64 Z" fill="${colors.trim}"/>
          <path class="ol" d="M170 58 Q186 58 186 68 Q176 68 170 64 Z" fill="${colors.trim}"/>
        `,
        torsoExtra: `<circle class="ol" cx="140" cy="150" r="10" fill="${colors.trim}"/>`,
      };
    case "Knight":
      return {
        headFill: colors.trim,
        helmet: true,
        headExtra: `<path class="ol" d="M132 44 L140 22 L148 44 Z" fill="#a83e3e"/>`,
        torsoExtra: `
          <circle class="ol" cx="140" cy="150" r="11" fill="${colors.primary}"/>
          <circle cx="140" cy="150" r="5" fill="${colors.trim}"/>
        `,
      };
    /* ---- superhero-archetype cases: shared cape + domino mask, unique chest emblem ---- */
    case "Ember":
      return {
        headFill: colors.head,
        headExtra: heroMask(colors.trim),
        backExtra: heroCape(colors.trim),
        torsoExtra: `<path class="ol" d="M140 142 Q131 156 138 167 Q140 173 146 167 Q153 156 140 142 Z" fill="${colors.trim}"/>`,
      };
    case "Storm":
      return {
        headFill: colors.head,
        headExtra: heroMask(colors.trim),
        backExtra: heroCape(colors.trim),
        torsoExtra: `<path class="ol" d="M146 138 L131 158 L139 158 L133 172 L153 151 L142 151 Z" fill="${colors.trim}"/>`,
      };
    case "Frost":
      return {
        headFill: colors.head,
        headExtra: heroMask(colors.trim),
        backExtra: heroCape(colors.trim),
        torsoExtra: `
          <path d="M140 138 L140 172 M126 155 L154 155 M130 145 L150 165 M150 145 L130 165"
                stroke="${colors.trim}" stroke-width="4" fill="none" stroke-linecap="round"/>
        `,
      };
    case "Earth":
      return {
        headFill: colors.head,
        headExtra: heroMask(colors.trim),
        backExtra: heroCape(colors.trim),
        torsoExtra: `<path class="ol" d="M124 168 L140 142 L156 168 Z" fill="${colors.trim}"/>`,
      };
    case "Cosmic":
      return {
        headFill: colors.head,
        headExtra: heroMask(colors.trim),
        backExtra: heroCape(colors.trim),
        torsoExtra: `<path class="ol" d="M140 138 L145 154 L161 156 L145 158 L140 174 L135 158 L119 156 L135 154 Z" fill="${colors.trim}"/>`,
      };
    default:
      return { headFill: colors.head };
  }
}

function heroCape(color) {
  return `<path class="ol" d="M108 130 L98 192 L140 180 L182 192 L172 130 Z" fill="${color}"/>`;
}

function heroMask(color) {
  return `<path class="ol" d="M108 76 Q140 64 172 76 L172 94 Q140 82 108 94 Z" fill="${color}"/>`;
}

/**
 * Renders a blocky mini-figure companion sitting on the chair (Kids Mode).
 * Same signature/coordinate system as companionSVG so the two are interchangeable.
 */
function avatarSVG(companion, state, custom) {
  const cust = Object.assign(defaultCustomization(), custom || {});
  const c = resolveAvatarColors(companion, cust.colorId);
  const f = avatarFeatures(companion.species, c);
  const blink = state === "sleep";

  const sizeScale = (SIZES.find((s) => s.id === cust.sizeId) || SIZES[1]).scale;
  const headScale = cust.ageId === "young" ? 1.14 : cust.ageId === "elder" ? 1.02 : 1;
  const torsoScale = cust.ageId === "young" ? 0.9 : cust.ageId === "elder" ? 1.04 : 1;

  const sleepy = cust.temperamentId === "sleepy";
  const grumpy = cust.temperamentId === "grumpy";
  const playful = cust.temperamentId === "playful";
  const sleepyEyes = blink || sleepy;

  const equipped = equippedAccessoryItems(cust.accessories);
  const haircut = equipped.find((a) => a.slot === "haircut");
  const eyecolorItem = equipped.find((a) => a.slot === "eyecolor");
  const pupilColor = eyecolorItem ? eyecolorItem.eyeColor : "#18110b";
  const headAccessories = equipped
    .filter((a) => a.zone === "head" && a.slot !== "haircut")
    .map((a) => a.render())
    .join("");
  const torsoAccessories = equipped
    .filter((a) => a.zone === "torso")
    .map((a) => a.render())
    .join("");

  const showHair = !f.helmet && !f.robotFace;
  const hair = showHair
    ? haircut
      ? haircut.render(DEFAULT_HAIR_COLOR)
      : `<path class="ol" d="M110 64 Q110 36 140 34 Q170 36 170 64 L162 64 Q162 46 140 46 Q118 46 118 64 Z" fill="${DEFAULT_HAIR_COLOR}"/>`
    : "";

  let face;
  if (f.helmet) {
    face = `<rect class="ol" x="118" y="82" width="44" height="12" rx="4" fill="#18110b"/>`;
  } else if (f.robotFace) {
    face = sleepyEyes
      ? `<rect x="122" y="86" width="14" height="4" fill="#18110b"/><rect x="144" y="86" width="14" height="4" fill="#18110b"/>`
      : `<rect class="ol" x="122" y="80" width="14" height="14" rx="3" fill="#7fe0e8"/><rect class="ol" x="144" y="80" width="14" height="14" rx="3" fill="#7fe0e8"/>`;
    face += `<rect x="130" y="102" width="20" height="4" fill="#18110b"/>`;
  } else {
    face = sleepyEyes
      ? `<path class="ol" d="M120 86 q8 6 16 0" stroke="#18110b" stroke-width="3" fill="none" stroke-linecap="round"/>
         <path class="ol" d="M144 86 q8 6 16 0" stroke="#18110b" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<circle cx="128" cy="86" r="4.5" fill="${pupilColor}"/><circle cx="152" cy="86" r="4.5" fill="${pupilColor}"/>`;
    let mouth;
    if (grumpy) mouth = `<path class="mouth" d="M126 106 Q140 98 154 106"/>`;
    else if (playful) mouth = `<path class="mouth" d="M122 98 Q140 114 158 98"/>`;
    else mouth = `<path class="mouth" d="M126 100 Q140 108 154 100"/>`;
    face += mouth;
  }

  const eyebrows =
    !f.robotFace && !f.helmet && grumpy
      ? `<path class="mouth" d="M116 74 L134 80"/><path class="mouth" d="M164 74 L146 80"/>`
      : "";

  const glasses =
    !f.helmet && cust.ageId === "elder"
      ? `<g class="glasses"><circle cx="128" cy="86" r="14"/><circle cx="152" cy="86" r="14"/><line x1="142" y1="84" x2="138" y2="84"/></g>`
      : "";

  const blush =
    cust.ageId === "young"
      ? `<circle cx="112" cy="98" r="6" fill="#ffb3c0" opacity="0.55"/><circle cx="168" cy="98" r="6" fill="#ffb3c0" opacity="0.55"/>`
      : "";

  const sleepyZ = sleepy
    ? `<text x="176" y="44" font-size="18" fill="#8a7360" transform="rotate(-10 176 44)">z</text>`
    : "";

  return `
  <svg viewBox="0 0 240 230" class="companion-svg companion-${state} temperament-${cust.temperamentId}" xmlns="http://www.w3.org/2000/svg">
    <ellipse class="floor-shadow" cx="140" cy="222" rx="92" ry="9"/>
    ${chairSVG(cust.chairColorId)}
    <g transform="translate(140 222) scale(${sizeScale}) translate(-140 -222)">
      <g class="companion-body">
        <g transform="translate(140 156) scale(${torsoScale}) translate(-140 -156)">
          ${f.backExtra || ""}
          <rect class="ol" x="82" y="180" width="26" height="34" rx="8" fill="${c.secondary}"/>
          <rect class="ol" x="172" y="180" width="26" height="34" rx="8" fill="${c.secondary}"/>
          <rect class="ol" x="80" y="206" width="30" height="12" rx="4" fill="#2e2b28"/>
          <rect class="ol" x="170" y="206" width="30" height="12" rx="4" fill="#2e2b28"/>
          <rect class="ol" x="78" y="128" width="26" height="56" rx="10" fill="${c.primary}"/>
          <rect class="ol" x="176" y="128" width="26" height="56" rx="10" fill="${c.primary}"/>
          <rect class="ol" x="100" y="120" width="80" height="66" rx="16" fill="${c.primary}"/>
          ${f.torsoExtra || ""}
          <circle class="ol" cx="91" cy="182" r="11" fill="${c.head}"/>
          <circle class="ol" cx="189" cy="182" r="11" fill="${c.head}"/>
          ${torsoAccessories}
        </g>
        <g transform="translate(140 88) scale(${headScale}) translate(-140 -88)">
          <rect class="ol" x="112" y="58" width="56" height="60" rx="16" fill="${f.headFill}"/>
          ${hair}
          ${f.headExtra || ""}
          ${blush}
          ${face}
          ${eyebrows}
          ${glasses}
          ${sleepyZ}
          ${headAccessories}
        </g>
      </g>
    </g>
  </svg>`;
}
