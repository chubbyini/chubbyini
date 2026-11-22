import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "assets");

const USERNAME = process.env.GITHUB_USERNAME || "chubbyini";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!TOKEN) {
  console.error("Missing GITHUB_TOKEN or GH_TOKEN environment variable.");
  process.exit(1);
}

const THEMES = {
  dark: {
    bgStart: "#080C14",
    bgEnd: "#0E1422",
    border: "#1A253E",
    divider: "#1A253E",
    ink: "#E8E6E1",
    dim: "#8A8F98",
    faint: "#5B6068",
    gold: "#E6C766",
    goldMuted: "#C9A227",
    trackBg: "#131C30",
    otherColor: "#64748B",
  },
  light: {
    bgStart: "#F8FAFC",
    bgEnd: "#FAF7EE",
    border: "#CBD5E1",
    divider: "#E2E8F0",
    ink: "#17202E",
    dim: "#475569",
    faint: "#64748B",
    gold: "#9A7414",
    goldMuted: "#C9A227",
    trackBg: "#E2E8F0",
    otherColor: "#94A3B8",
  },
};

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function fetchGitHubTelemetry(login, token) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
          totalCount
          nodes {
            name
            stargazerCount
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
        contributionsCollection {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "chubbyini-profile-telemetry",
    },
    body: JSON.stringify({ query, variables: { login } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL API failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(payload.errors)}`);
  }

  const user = payload.data?.user;
  if (!user) {
    throw new Error(`GitHub user '${login}' not found in GraphQL response`);
  }

  const totalContributions =
    user.contributionsCollection?.contributionCalendar?.totalContributions ?? 0;
  const totalPublicRepos = user.repositories?.totalCount ?? 0;

  const langTotals = new Map();
  for (const repo of user.repositories?.nodes ?? []) {
    for (const edge of repo.languages?.edges ?? []) {
      const name = edge.node?.name;
      if (!name || !edge.size) continue;
      const existing = langTotals.get(name);
      if (existing) {
        existing.size += edge.size;
      } else {
        langTotals.set(name, {
          name,
          color: edge.node?.color || "#8A8F98",
          size: edge.size,
        });
      }
    }
  }

  const sorted = [...langTotals.values()].sort((a, b) => b.size - a.size);
  const grandTotal = sorted.reduce((sum, item) => sum + item.size, 0);

  let topLanguages = [];
  if (sorted.length <= 5) {
    topLanguages = sorted;
  } else {
    const top4 = sorted.slice(0, 4);
    const otherSize = sorted.slice(4).reduce((sum, item) => sum + item.size, 0);
    topLanguages = [
      ...top4,
      { name: "Other", color: null, size: otherSize },
    ];
  }

  // Compute tenths-of-percent integers so percentages always sum cleanly to 100.0%
  const rawTenths = topLanguages.map((lang) =>
    grandTotal > 0 ? (lang.size / grandTotal) * 1000 : 0
  );
  const floored = rawTenths.map((v) => Math.floor(v));
  let remainder = 1000 - floored.reduce((a, b) => a + b, 0);
  const byFraction = rawTenths
    .map((v, idx) => ({ idx, frac: v - floored[idx] }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder && i < byFraction.length; i += 1) {
    floored[byFraction[i].idx] += 1;
  }

  const languages = topLanguages.map((lang, idx) => ({
    name: lang.name,
    color: lang.color,
    size: lang.size,
    pct: (floored[idx] / 10).toFixed(1),
    ratio: grandTotal > 0 ? lang.size / grandTotal : 0,
  }));

  return {
    totalContributions,
    totalPublicRepos,
    languages,
  };
}

function buildStatsSvg(mode, data, updatedDate) {
  const t = THEMES[mode];
  const barX = 640;
  const barY = 74;
  const barWidth = 516;
  const barHeight = 12;

  let cursorX = barX;
  const segments = data.languages
    .map((lang, index) => {
      const isLast = index === data.languages.length - 1;
      const segW = isLast
        ? Math.max(0, barX + barWidth - cursorX)
        : Math.max(2, Math.round(lang.ratio * barWidth));
      const x = cursorX;
      cursorX += segW;
      const fill = lang.color || t.otherColor;
      return `      <rect x="${x}" y="${barY}" width="${segW}" height="${barHeight}" fill="${escapeXml(fill)}" />`;
    })
    .join("\n");

  const legendItems = data.languages
    .map((lang, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const baseX = col === 0 ? 640 : 908;
      const rightEdge = col === 0 ? 878 : 1156;
      const y = 114 + row * 28;
      const dotColor = lang.color || t.otherColor;

      return `    <g>
      <circle cx="${baseX + 5}" cy="${y - 4}" r="4.5" fill="${escapeXml(dotColor)}" />
      <text x="${baseX + 18}" y="${y}" class="font-sans" font-size="13" font-weight="500" fill="${t.ink}">${escapeXml(lang.name)}</text>
      <text x="${rightEdge}" y="${y}" text-anchor="end" class="font-mono" font-size="12.5" fill="${t.dim}">${escapeXml(lang.pct)}%</text>
    </g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="200" viewBox="0 0 1200 200" role="img" aria-label="GitHub telemetry and language breakdown for ${escapeXml(USERNAME)}">
  <title>GitHub Telemetry — ${escapeXml(USERNAME)}</title>
  <style>
    .font-display { font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
  <defs>
    <linearGradient id="stats-bg-${mode}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.bgStart}" />
      <stop offset="100%" stop-color="${t.bgEnd}" />
    </linearGradient>
    <clipPath id="bar-clip-${mode}">
      <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="6" />
    </clipPath>
  </defs>

  <rect x="0.5" y="0.5" width="1199" height="199" rx="14" fill="url(#stats-bg-${mode})" stroke="${t.border}" stroke-width="1" />

  <!-- Left half: 2x2 Telemetry Readout -->
  <g>
    <text x="44" y="46" class="font-mono" font-size="12" fill="${t.dim}">Contributions (12m)</text>
    <text x="44" y="82" class="font-display" font-size="32" font-weight="700" fill="${t.ink}">${escapeXml(data.totalContributions.toLocaleString("en-US"))}</text>

    <text x="336" y="46" class="font-mono" font-size="12" fill="${t.dim}">Original Public Repos</text>
    <text x="336" y="82" class="font-display" font-size="32" font-weight="700" fill="${t.ink}">${escapeXml(String(data.totalPublicRepos))}</text>

    <line x1="44" y1="104" x2="556" y2="104" stroke="${t.divider}" stroke-width="1" />

    <text x="44" y="132" class="font-mono" font-size="12" fill="${t.dim}">Open-Source Package</text>
    <text x="44" y="160" class="font-mono" font-size="17" font-weight="600" fill="${t.gold}">@sojournerbuilds/mark</text>

    <text x="336" y="132" class="font-mono" font-size="12" fill="${t.dim}">Published Research</text>
    <text x="336" y="160" class="font-mono" font-size="17" font-weight="600" fill="${t.ink}">IJRIAS Vol. 10(7)</text>
  </g>

  <!-- Vertical divider -->
  <line x1="600" y1="26" x2="600" y2="174" stroke="${t.divider}" stroke-width="1" />

  <!-- Right half: Language Composition -->
  <g>
    <text x="640" y="48" class="font-sans" font-size="14" font-weight="600" fill="${t.ink}">Language composition</text>
    <text x="1156" y="48" text-anchor="end" class="font-mono" font-size="11.5" fill="${t.dim}" opacity="0.88">Updated ${escapeXml(updatedDate)}</text>

    <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="6" fill="${t.trackBg}" />
    <g clip-path="url(#bar-clip-${mode})">
${segments}
    </g>

${legendItems}
  </g>
</svg>
`;
}

async function main() {
  const data = await fetchGitHubTelemetry(USERNAME, TOKEN);
  const updatedDate = new Date().toISOString().slice(0, 10);

  mkdirSync(ASSETS_DIR, { recursive: true });
  writeFileSync(
    join(ASSETS_DIR, "stats-dark.svg"),
    buildStatsSvg("dark", data, updatedDate),
    "utf8"
  );
  writeFileSync(
    join(ASSETS_DIR, "stats-light.svg"),
    buildStatsSvg("light", data, updatedDate),
    "utf8"
  );

  console.log(
    `Generated stats SVGs for ${USERNAME}: ${data.totalContributions} contributions, ${data.totalPublicRepos} original public repos, ${data.languages.length} languages.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
