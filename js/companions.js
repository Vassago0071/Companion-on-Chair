/* Companion roster + South-Park-inspired SVG renderer: thick black outlines,
   oversized round eyes, flat cutout-paper shapes. All character designs
   below are original to this project, not artwork from any third-party show
   or app — only the general cutout-animation *style* is referenced. */

const COMPANIONS = [
  {
    id: "cat",
    name: "Momo",
    species: "Cat",
    tagline: "A calm tabby who purrs while you type.",
    colors: { body: "#e8935a", belly: "#fff3e2", accent: "#c96f36" },
  },
  {
    id: "dog",
    name: "Biscuit",
    species: "Corgi",
    tagline: "An eager pup who guards your deadlines.",
    colors: { body: "#e9b976", belly: "#fff8ec", accent: "#c98a3a" },
  },
  {
    id: "fox",
    name: "Ember",
    species: "Fox",
    tagline: "A quiet fox that keeps one eye on the clock.",
    colors: { body: "#e8683f", belly: "#fff6ee", accent: "#a83e22" },
  },
  {
    id: "owl",
    name: "Sage",
    species: "Owl",
    tagline: "A night-shift owl who never seems to blink.",
    colors: { body: "#8d7a9e", belly: "#f1ecf7", accent: "#5e4c72" },
  },
  {
    id: "bunny",
    name: "Clover",
    species: "Bunny",
    tagline: "A soft-footed bunny who thumps when the timer ends.",
    colors: { body: "#f4c9d6", belly: "#fff5f8", accent: "#d98ba3" },
  },
];

function getCompanion(id) {
  return COMPANIONS.find((c) => c.id === id) || COMPANIONS[0];
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

function defaultCustomization() {
  return { colorId: "classic", sizeId: "medium", ageId: "adult", temperamentId: "calm" };
}

function resolveColors(companion, colorId) {
  const palette = PALETTES.find((p) => p.id === colorId);
  return palette && palette.colors ? palette.colors : companion.colors;
}

/* Shared wooden chair, drawn once and reused under every companion. */
function chairSVG() {
  return `
    <g class="chair">
      <rect class="ol" x="70" y="150" width="14" height="70" rx="4" fill="#8a5a3b"/>
      <rect class="ol" x="196" y="150" width="14" height="70" rx="4" fill="#8a5a3b"/>
      <rect class="ol" x="60" y="140" width="160" height="18" rx="6" fill="#a06b45"/>
      <rect class="ol" x="60" y="40" width="16" height="110" rx="6" fill="#8a5a3b"/>
      <rect class="ol" x="66" y="44" width="4" height="96" rx="2" fill="#6f4730"/>
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
        extra: `<path class="ol" d="M60 148 Q20 140 18 90 Q17 68 34 62 Q30 60 44 66 Q34 92 50 118 Q60 132 70 146 Q66 150 60 148 Z" fill="${colors.body}"/>`,
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
          <path class="ol" d="M58 150 Q10 130 16 78 Q34 90 52 84 Q42 112 62 138 Q68 146 58 150 Z" fill="${colors.body}"/>
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
 * custom: { colorId, sizeId, ageId, temperamentId } — see defaultCustomization()
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

  let eyes;
  if (blink) {
    eyes = `
      <path class="ol" d="M100 84 q18 12 36 0" stroke="#18110b" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path class="ol" d="M172 84 q18 12 36 0" stroke="#18110b" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  } else {
    eyes = `
      <ellipse class="ol" cx="118" cy="88" rx="${rx}" ry="${ry}" fill="#fff"/>
      <ellipse class="ol" cx="162" cy="88" rx="${rx}" ry="${ry}" fill="#fff"/>
      <circle cx="122" cy="84" r="5.5" fill="#18110b"/>
      <circle cx="158" cy="84" r="5.5" fill="#18110b"/>
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
    ${chairSVG()}
    <g transform="translate(140 222) scale(${sizeScale}) translate(-140 -222)">
      <g class="companion-body">
        <g transform="translate(140 150) scale(${torsoScale}) translate(-140 -150)">
          ${f.extra || ""}
          <ellipse class="ol" cx="140" cy="134" rx="58" ry="46" fill="${c.body}"/>
          <ellipse class="ol" cx="140" cy="150" rx="33" ry="27" fill="${c.belly}"/>
          <ellipse class="ol" cx="110" cy="180" rx="15" ry="11" fill="${c.body}"/>
          <ellipse class="ol" cx="170" cy="180" rx="15" ry="11" fill="${c.body}"/>
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
        </g>
      </g>
    </g>
  </svg>`;
}
