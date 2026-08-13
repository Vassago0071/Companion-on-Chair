/* Companion roster + hand-drawn-style SVG renderer.
   All character designs below are original to this project (simple shape-built
   illustrations), not artwork from any third-party app. */

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

/* Shared wooden chair, drawn once and reused under every companion. */
function chairSVG() {
  return `
    <g class="chair">
      <rect x="70" y="150" width="14" height="70" rx="4" fill="#8a5a3b"/>
      <rect x="196" y="150" width="14" height="70" rx="4" fill="#8a5a3b"/>
      <rect x="60" y="140" width="160" height="18" rx="6" fill="#a06b45"/>
      <rect x="60" y="40" width="16" height="110" rx="6" fill="#8a5a3b"/>
      <rect x="66" y="44" width="4" height="96" rx="2" fill="#6f4730"/>
    </g>
  `;
}

/* Species-specific ears/tail/markings layered onto a shared body+head base. */
function speciesFeatures(species, colors) {
  switch (species) {
    case "Cat":
      return {
        ears: `
          <path d="M100 66 L92 38 L118 58 Z" fill="${colors.body}"/>
          <path d="M180 66 L188 38 L162 58 Z" fill="${colors.body}"/>
          <path d="M102 60 L98 44 L112 56 Z" fill="${colors.accent}"/>
          <path d="M178 60 L182 44 L168 56 Z" fill="${colors.accent}"/>
        `,
        extra: `
          <path d="M60 120 Q30 110 26 80" stroke="${colors.accent}" stroke-width="8" fill="none" stroke-linecap="round"/>
        `,
        muzzle: `<path d="M132 92 L140 98 L148 92" stroke="${colors.accent}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      };
    case "Corgi":
      return {
        ears: `
          <path d="M96 62 Q90 32 112 40 Q108 58 108 66 Z" fill="${colors.body}"/>
          <path d="M184 62 Q190 32 168 40 Q172 58 172 66 Z" fill="${colors.body}"/>
          <path d="M100 58 Q98 40 110 44 Z" fill="${colors.belly}"/>
          <path d="M180 58 Q182 40 170 44 Z" fill="${colors.belly}"/>
        `,
        extra: `
          <ellipse cx="140" cy="112" rx="26" ry="18" fill="${colors.belly}"/>
        `,
        muzzle: `<ellipse cx="140" cy="100" rx="16" ry="11" fill="${colors.belly}"/><circle cx="140" cy="96" r="3.5" fill="#5b3a22"/>`,
      };
    case "Fox":
      return {
        ears: `
          <path d="M98 64 L86 30 L120 56 Z" fill="${colors.body}"/>
          <path d="M182 64 L194 30 L160 56 Z" fill="${colors.body}"/>
          <path d="M100 56 L94 38 L112 52 Z" fill="#2b2320"/>
          <path d="M180 56 L186 38 L168 52 Z" fill="#2b2320"/>
        `,
        extra: `
          <path d="M56 118 Q20 100 24 66 Q40 78 52 74 Q46 96 62 112 Z" fill="${colors.body}"/>
          <circle cx="30" cy="72" r="7" fill="${colors.belly}"/>
        `,
        muzzle: `<path d="M140 90 L152 100 L140 104 L128 100 Z" fill="${colors.belly}"/><circle cx="140" cy="100" r="3" fill="#2b2320"/>`,
      };
    case "Owl":
      return {
        ears: `
          <path d="M104 62 Q98 40 116 46" stroke="${colors.body}" stroke-width="10" fill="none" stroke-linecap="round"/>
          <path d="M176 62 Q182 40 164 46" stroke="${colors.body}" stroke-width="10" fill="none" stroke-linecap="round"/>
        `,
        extra: `
          <path d="M96 108 Q140 128 184 108 Q184 128 140 138 Q96 128 96 108 Z" fill="${colors.accent}" opacity="0.5"/>
        `,
        muzzle: `<path d="M134 96 L140 108 L146 96 Z" fill="#e8a23a"/>`,
        bigEyes: true,
      };
    case "Bunny":
      return {
        ears: `
          <path d="M110 66 Q100 10 122 20 Q126 56 128 68 Z" fill="${colors.body}"/>
          <path d="M170 66 Q180 10 158 20 Q154 56 152 68 Z" fill="${colors.body}"/>
          <path d="M113 58 Q108 20 120 26 Q122 50 124 60 Z" fill="${colors.belly}"/>
          <path d="M167 58 Q172 20 160 26 Q158 50 156 60 Z" fill="${colors.belly}"/>
        `,
        extra: `
          <circle cx="46" cy="118" r="12" fill="${colors.belly}" stroke="${colors.accent}" stroke-width="1.5"/>
        `,
        muzzle: `<path d="M136 96 L140 102 L144 96" stroke="${colors.accent}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      };
    default:
      return { ears: "", extra: "", muzzle: "" };
  }
}

/**
 * Renders a companion sitting on the chair as an inline SVG string.
 * state: "idle" | "focus" | "sleep"
 */
function companionSVG(companion, state) {
  const c = companion.colors;
  const f = speciesFeatures(companion.species, c);
  const blink = state === "sleep";
  const eye = blink
    ? `<path d="M126 88 q6 4 12 0" stroke="#3a2a20" stroke-width="2.5" fill="none" stroke-linecap="round"/>
       <path d="M152 88 q6 4 12 0" stroke="#3a2a20" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    : f.bigEyes
    ? `<circle cx="130" cy="90" r="9" fill="#2b2320"/><circle cx="150" cy="90" r="9" fill="#2b2320"/>
       <circle cx="133" cy="87" r="2.4" fill="#fff"/><circle cx="153" cy="87" r="2.4" fill="#fff"/>`
    : `<circle cx="128" cy="90" r="4" fill="#2b2320"/><circle cx="152" cy="90" r="4" fill="#2b2320"/>
       <circle cx="129.5" cy="88.5" r="1.2" fill="#fff"/><circle cx="153.5" cy="88.5" r="1.2" fill="#fff"/>`;

  return `
  <svg viewBox="0 0 240 230" class="companion-svg companion-${state}" xmlns="http://www.w3.org/2000/svg">
    ${chairSVG()}
    <g class="companion-body">
      ${f.extra || ""}
      <ellipse cx="140" cy="130" rx="52" ry="42" fill="${c.body}"/>
      <ellipse cx="140" cy="146" rx="30" ry="22" fill="${c.belly}"/>
      <ellipse cx="108" cy="176" rx="12" ry="8" fill="${c.body}"/>
      <ellipse cx="172" cy="176" rx="12" ry="8" fill="${c.body}"/>
      ${f.ears}
      <circle cx="140" cy="92" r="40" fill="${c.body}"/>
      <ellipse cx="140" cy="104" rx="24" ry="18" fill="${c.belly}"/>
      ${eye}
      ${f.muzzle || ""}
    </g>
  </svg>`;
}
