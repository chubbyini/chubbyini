import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "assets");

const THEMES = {
  dark: {
    bgStart: "#080C14",
    bgEnd: "#0E1422",
    border: "#1A253E",
    grid: "#1A253E",
    ink: "#E8E6E1",
    dim: "#8A8F98",
    faint: "#5B6068",
    deep: "#080C14",
    gold: "#E6C766",
    goldMuted: "#C9A227",
    strike: "#38BDF8",
    ship: "#E8E6E1",
    wake: "#C9A227",
    glowColor: "#C9A227",
    glowOpacity: "0.14",
  },
  light: {
    bgStart: "#F8FAFC",
    bgEnd: "#FAF7EE",
    border: "#CBD5E1",
    grid: "#E2E8F0",
    ink: "#17202E",
    dim: "#475569",
    faint: "#64748B",
    deep: "#F8FAFC",
    gold: "#9A7414",
    goldMuted: "#C9A227",
    strike: "#0284C7",
    ship: "#17202E",
    wake: "#9A7414",
    glowColor: "#C9A227",
    glowOpacity: "0.12",
  },
};

function buildDegreeTicks(theme) {
  const cx = 60;
  const cy = 60;
  const ticks = [];

  for (let i = 0; i < 72; i += 1) {
    const deg = i * 5;
    const rad = ((deg - 90) * Math.PI) / 180;
    const isMajor = deg % 45 === 0;
    const isMedium = !isMajor && deg % 15 === 0;

    const rInner = isMajor ? 40 : isMedium ? 43 : 45.5;
    const rOuter = 48;

    const x1 = +(cx + rInner * Math.cos(rad)).toFixed(3);
    const y1 = +(cy + rInner * Math.sin(rad)).toFixed(3);
    const x2 = +(cx + rOuter * Math.cos(rad)).toFixed(3);
    const y2 = +(cy + rOuter * Math.sin(rad)).toFixed(3);

    const stroke = isMajor ? theme.gold : theme.faint;
    const opacity = isMajor ? "0.95" : isMedium ? "0.7" : "0.45";
    const width = isMajor ? "1.6" : isMedium ? "1" : "0.7";

    ticks.push(
      `      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${width}" />`
    );
  }

  return ticks.join("\n");
}

function buildHeroSvg(mode) {
  const t = THEMES[mode];
  const ticks = buildDegreeTicks(t);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="320" viewBox="0 0 1200 320" role="img" aria-label="Inioluwa Daniel Osibajo — Software Engineer at PicckR and Founder of Sojourner Builds">
  <title>Inioluwa Daniel Osibajo — Software Engineer &amp; Founder of Sojourner Builds</title>
  <style>
    @keyframes sj-spin { to { transform: rotate(360deg); } }
    @keyframes sj-wp { 0%, 100% { opacity: 0.35; } 45% { opacity: 1; } }
    @keyframes sj-beacon { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
    .sj-dial { animation: sj-spin 42s linear infinite; transform-origin: 60px 60px; }
    .sj-wp { animation: sj-wp 3.2s ease-in-out infinite; }
    .sj-beacon { animation: sj-beacon 2.8s ease-in-out infinite; }
    .font-display { font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    @media (prefers-reduced-motion: reduce) {
      .sj-dial, .sj-wp, .sj-beacon { animation: none; }
    }
  </style>
  <defs>
    <linearGradient id="bg-${mode}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.bgStart}" />
      <stop offset="100%" stop-color="${t.bgEnd}" />
    </linearGradient>
    <radialGradient id="compass-glow-${mode}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${t.glowColor}" stop-opacity="${t.glowOpacity}" />
      <stop offset="100%" stop-color="${t.glowColor}" stop-opacity="0" />
    </radialGradient>
    <clipPath id="card-clip-${mode}">
      <rect x="0.5" y="0.5" width="1199" height="319" rx="16" />
    </clipPath>
  </defs>

  <!-- Canvas & hairline border -->
  <rect x="0.5" y="0.5" width="1199" height="319" rx="16" fill="url(#bg-${mode})" stroke="${t.border}" stroke-width="1" />

  <!-- Subtle nautical chart arcs & grid lines -->
  <g clip-path="url(#card-clip-${mode})" fill="none" stroke="${t.grid}">
    <circle cx="1005" cy="160" r="190" stroke-width="1" stroke-opacity="0.55" stroke-dasharray="3 6" />
    <circle cx="1005" cy="160" r="285" stroke-width="1" stroke-opacity="0.35" />
    <circle cx="1005" cy="160" r="390" stroke-width="1" stroke-opacity="0.22" stroke-dasharray="2 8" />
    <line x1="56" y1="248" x2="770" y2="248" stroke-width="1" stroke-opacity="0.65" />
    <circle cx="1005" cy="160" r="170" fill="url(#compass-glow-${mode})" stroke="none" />
  </g>

  <!-- Corner registration ticks -->
  <g fill="none" stroke="${t.goldMuted}" stroke-width="1.25" stroke-opacity="0.55">
    <path d="M 18 30 L 18 18 L 30 18" />
    <path d="M 1170 18 L 1182 18 L 1182 30" />
    <path d="M 18 290 L 18 302 L 30 302" />
    <path d="M 1170 302 L 1182 302 L 1182 290" />
  </g>

  <!-- Editorial left block (strictly within x=56..770) -->
  <g>
    <circle cx="62" cy="60" r="4" fill="${t.strike}" class="sj-beacon" />
    <circle cx="62" cy="60" r="8" fill="${t.strike}" fill-opacity="0.16" />
    <text x="78" y="64" class="font-mono" font-size="13" fill="${t.dim}">Shipping in production — Nigeria</text>

    <text x="56" y="124" class="font-display" font-size="44" font-weight="700" letter-spacing="-0.025em" fill="${t.ink}">Inioluwa Daniel Osibajo</text>

    <text x="56" y="162" class="font-sans" font-size="18.5" font-weight="600" fill="${t.gold}">Software Engineer at PicckR  |  Founder of Sojourner Builds</text>

    <text x="56" y="202" class="font-sans" font-size="15.5" fill="${t.dim}">I ship real products, architect resilient web systems,</text>
    <text x="56" y="226" class="font-sans" font-size="15.5" fill="${t.dim}">and write about how I build them.</text>

    <text x="56" y="276" class="font-mono" font-size="12" fill="${t.dim}" opacity="0.88">Waypoints: Lagos 6.52°N  /  Kaduna 10.51°N  /  Cross River 5.87°N</text>
  </g>

  <!-- Authentic @sojournerbuilds/mark nautical waymark centerpiece -->
  <g transform="translate(1005, 160) scale(2.05) translate(-60, -60)">
    <g>
      <circle cx="60" cy="60" r="52" fill="none" stroke="${t.dim}" stroke-width="1.4" stroke-opacity="0.85" />
      <circle cx="60" cy="60" r="38" fill="none" stroke="${t.faint}" stroke-width="0.75" stroke-opacity="0.65" />

      <!-- Rotating degree ticks -->
      <g class="sj-dial">
${ticks}
      </g>

      <!-- Cardinal & intercardinal labels -->
      <text x="60" y="30" text-anchor="middle" dominant-baseline="central" font-size="8" font-weight="700" class="font-mono" fill="${t.gold}">N</text>
      <text x="81.213" y="38.787" text-anchor="middle" dominant-baseline="central" font-size="5.5" font-weight="400" class="font-mono" fill="${t.dim}" opacity="0.85">NE</text>
      <text x="90" y="60" text-anchor="middle" dominant-baseline="central" font-size="8" font-weight="700" class="font-mono" fill="${t.ink}">E</text>
      <text x="81.213" y="81.213" text-anchor="middle" dominant-baseline="central" font-size="5.5" font-weight="400" class="font-mono" fill="${t.dim}" opacity="0.85">SE</text>
      <text x="60" y="90" text-anchor="middle" dominant-baseline="central" font-size="8" font-weight="700" class="font-mono" fill="${t.ink}">S</text>
      <text x="38.787" y="81.213" text-anchor="middle" dominant-baseline="central" font-size="5.5" font-weight="400" class="font-mono" fill="${t.dim}" opacity="0.85">SW</text>
      <text x="30" y="60" text-anchor="middle" dominant-baseline="central" font-size="8" font-weight="700" class="font-mono" fill="${t.ink}">W</text>
      <text x="38.787" y="38.787" text-anchor="middle" dominant-baseline="central" font-size="5.5" font-weight="400" class="font-mono" fill="${t.dim}" opacity="0.85">NW</text>

      <!-- Central 4-point compass rose -->
      <g opacity="0.7">
        <polygon points="60,46 62,58 60,70 58,58" fill="${t.gold}" />
        <polygon points="60,50 61,58 60,66 59,58" fill="${t.faint}" />
        <polygon points="74,60 62,62 50,60 62,58" fill="${t.ink}" opacity="0.6" />
        <polygon points="46,60 58,61.5 74,60 58,58.5" fill="${t.faint}" opacity="0.7" />
        <circle cx="60" cy="60" r="2" fill="${t.gold}" />
      </g>

      <!-- Journey arc & waypoints -->
      <path d="M23.2 96.8 A52 52 0 0 0 96.8 96.8" fill="none" stroke="${t.goldMuted}" stroke-width="2" stroke-linecap="round" />
      <circle cx="23.2" cy="96.8" r="1.9" fill="${t.deep}" stroke="${t.dim}" stroke-width="1.2">
        <title>Lagos</title>
      </circle>
      <circle cx="96.8" cy="96.8" r="2.8" fill="${t.dim}">
        <title>Kaduna</title>
      </circle>
      <circle cx="60" cy="112" r="3.8" fill="${t.strike}" class="sj-wp">
        <title>Cross River — now</title>
      </circle>
    </g>

    <!-- Sailing vessel & wake trail -->
    <g>
      <path d="M60 8 A52 52 0 0 1 111.2 51" fill="none" stroke="${t.wake}" stroke-width="2" stroke-linecap="round" stroke-opacity="0.9" />
      <g transform="translate(60 8)">
        <line x1="-10" y1="0" x2="-15" y2="-4" stroke="${t.ship}" stroke-width="1" stroke-linecap="round" />
        <line x1="-15" y1="-4" x2="5" y2="-11" stroke="${t.faint}" stroke-width="0.7" stroke-opacity="0.9" />
        <path d="M-11 0 H11 L7 6 H-7 Z" fill="${t.ship}" stroke="${t.deep}" stroke-width="0.8" stroke-linejoin="round" />
        <rect x="-11" y="-1.4" width="22" height="1.6" fill="${t.ship}" />
        <rect x="6" y="-4.2" width="4" height="3" fill="${t.dim}" stroke="${t.deep}" stroke-width="0.4" />
        <line x1="-3" y1="-1" x2="-3" y2="-13" stroke="${t.ship}" stroke-width="1.5" stroke-linecap="round" />
        <line x1="5" y1="-1" x2="5" y2="-11" stroke="${t.ship}" stroke-width="1.4" stroke-linecap="round" />
        <path d="M-8.5 -13 H2.5 L1 -3 H-7.5 Z" fill="${t.ship}" stroke="${t.deep}" opacity="0.95" stroke-width="0.5" stroke-linejoin="round" />
        <path d="M2 -11 H9 L8 -3 H3 Z" fill="${t.dim}" stroke="${t.deep}" stroke-width="0.5" stroke-linejoin="round" />
        <line x1="-8" y1="-8" x2="2" y2="-8" stroke="${t.faint}" stroke-width="0.5" stroke-opacity="0.8" />
        <polygon points="-3,-13 -8,-11.5 -3,-10" fill="${t.strike}" />
        <circle cx="-4" cy="3" r="0.8" fill="${t.deep}" />
        <circle cx="0" cy="3" r="0.8" fill="${t.deep}" />
        <circle cx="4" cy="3" r="0.8" fill="${t.deep}" />
      </g>
    </g>
  </g>
</svg>
`;
}

function buildFooterSvg(mode) {
  const t = THEMES[mode];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="64" viewBox="0 0 1200 64" role="img" aria-label="Sojourner Builds footer colophon">
  <style>
    .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
  <line x1="24" y1="20" x2="576" y2="20" stroke="${t.border}" stroke-width="1" />
  <line x1="624" y1="20" x2="1176" y2="20" stroke="${t.border}" stroke-width="1" />
  <polygon points="600,12 608,20 600,28 592,20" fill="none" stroke="${t.goldMuted}" stroke-width="1.25" />
  <circle cx="600" cy="20" r="2" fill="${t.gold}" />
  <text x="600" y="48" text-anchor="middle" class="font-mono" font-size="12" fill="${t.dim}" opacity="0.88">Sojourner Builds  |  Inioluwa Daniel Osibajo  |  @chubbyini</text>
</svg>
`;
}

mkdirSync(ASSETS_DIR, { recursive: true });
writeFileSync(join(ASSETS_DIR, "hero-dark.svg"), buildHeroSvg("dark"), "utf8");
writeFileSync(join(ASSETS_DIR, "hero-light.svg"), buildHeroSvg("light"), "utf8");
writeFileSync(join(ASSETS_DIR, "footer-dark.svg"), buildFooterSvg("dark"), "utf8");
writeFileSync(join(ASSETS_DIR, "footer-light.svg"), buildFooterSvg("light"), "utf8");

console.log("Generated hero-dark.svg, hero-light.svg, footer-dark.svg, footer-light.svg");
