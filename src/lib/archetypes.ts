/**
 * KinoPark Cinema Identity — taxonomy.
 *
 * Two-axis classification:
 *   Archetype  — TASTE signature (genre, sensibility)
 *   Badge      — BEHAVIOUR signature (premium seats, frequency, social pattern)
 *
 * Plus a single "insight" line per user — a Spotify-Wrapped-style observed
 * fact pulled from their ticket history. Insights are the soul of the card.
 *
 * 10 archetypes × 8 badges × N insight templates = lots of unique cards.
 */

export type Archetype = {
  id: string;
  /** Card title — Latin */
  title: string;
  /** Card title — Armenian */
  titleHy: string;
  /** One-line tagline shown under the title */
  tagline: string;
  /** Short paragraph used elsewhere (deck preview, motivation fallback) */
  description: string;
  /** Genre stamp shown top-right on the card */
  genre: string;
  /** Card background — deeply tinted dark, never black */
  bg: string;
  /** White-ish text colour */
  ink: string;
  /** Bright signature accent — labels, brand stripe, insight pill */
  accent: string;
  /** Three signature films */
  signatureFilms: [string, string, string];
  /** Three mood adjectives */
  mood: [string, string, string];
};

export const ARCHETYPES: Archetype[] = [
  {
    id: "cinephile",
    title: "The Cinephile",
    titleHy: "Կինոմանը",
    tagline: "Films are arguments, and you keep score.",
    description:
      "You watch directors, not movies. A long take is a love letter and you read every one twice.",
    genre: "Art-house",
    bg: "#0E0F12",
    ink: "#F4EBD9",
    accent: "#D4B36A",
    signatureFilms: ["In the Mood for Love", "Stalker", "The Tree of Life"],
    mood: ["Patient", "Reverent", "Attentive"],
  },
  {
    id: "anime-devotee",
    title: "Anime Devotee",
    titleHy: "Անիմեսեր",
    tagline: "You believe a sky can mean something.",
    description:
      "Anime, animation, hand-drawn worlds. Frames you'd hang on a wall. A whisper for a soundtrack.",
    genre: "Anime",
    bg: "#1F1410",
    ink: "#FFE7D0",
    accent: "#FF8FAA",
    signatureFilms: ["Spirited Away", "Your Name", "The Boy and the Heron"],
    mood: ["Tender", "Wide-eyed", "Adrift"],
  },
  {
    id: "drama-queen",
    title: "Drama Queen",
    titleHy: "Դրամայի թագուհին",
    tagline: "If it doesn't make you cry, it isn't trying.",
    description:
      "Drama is your home key. You stay through the credits because the silence after is part of the film.",
    genre: "Drama",
    bg: "#1A0D0E",
    ink: "#FFE2D6",
    accent: "#FF5C45",
    signatureFilms: ["Marriage Story", "Manchester by the Sea", "Past Lives"],
    mood: ["Open", "Tender", "Devout"],
  },
  {
    id: "horror-junkie",
    title: "Horror Junkie",
    titleHy: "Սարսափի սիրահար",
    tagline: "You came for the dread. You stayed for the score.",
    description:
      "Horror is craft to you. Slow dread over jump scares. The dark hum that follows you home.",
    genre: "Horror",
    bg: "#0A0B12",
    ink: "#E7DCC8",
    accent: "#D9352B",
    signatureFilms: ["Hereditary", "The Witch", "Under the Skin"],
    mood: ["Steady", "Curious", "Composed"],
  },
  {
    id: "scifi-nerd",
    title: "Sci-Fi Nerd",
    titleHy: "Գիտաֆանտաստ",
    tagline: "Tomorrow is a genre and you live there.",
    description:
      "You watch sci-fi the way historians read primary sources. Worlds first, plots second.",
    genre: "Sci-Fi",
    bg: "#08131F",
    ink: "#E6F4FF",
    accent: "#5DD0E6",
    signatureFilms: ["Blade Runner 2049", "Arrival", "Annihilation"],
    mood: ["Restless", "Searching", "Lucid"],
  },
  {
    id: "action-hero",
    title: "Action Hero",
    titleHy: "Բոյովիկ",
    tagline: "Plot is a delivery system. You came for the kinetics.",
    description:
      "Stunt work, set pieces, a third act that doesn't blink. You clap when something explodes correctly.",
    genre: "Action",
    bg: "#170A04",
    ink: "#FFE4B5",
    accent: "#FF8736",
    signatureFilms: ["Mad Max: Fury Road", "John Wick", "Mission: Impossible"],
    mood: ["Wired", "Alert", "Hungry"],
  },
  {
    id: "sleuth",
    title: "The Sleuth",
    titleHy: "Հետախույզը",
    tagline: "Every frame is evidence. You're the jury.",
    description:
      "Slow-burn thrillers, neo-noir, anything with a cigarette and a question. First to suspect the friend.",
    genre: "Thriller",
    bg: "#101013",
    ink: "#EDE3CC",
    accent: "#E0B647",
    signatureFilms: ["Zodiac", "Memories of Murder", "Prisoners"],
    mood: ["Patient", "Sharp", "Quiet"],
  },
  {
    id: "hopeless-romantic",
    title: "Hopeless Romantic",
    titleHy: "Ռոմանտիկ",
    tagline: "You'd live in the meet-cute if they let you.",
    description:
      "Romance, rom-coms, the long-distance call before the airport scene. You re-watch endings on Sundays.",
    genre: "Romance",
    bg: "#1E0A14",
    ink: "#FFD9DC",
    accent: "#FF447A",
    signatureFilms: ["Before Sunrise", "Notting Hill", "La La Land"],
    mood: ["Soft", "Hopeful", "Loyal"],
  },
  {
    id: "comedy-captain",
    title: "Comedy Captain",
    titleHy: "Կատակասերը",
    tagline: "If a film can't make you laugh, what is it doing.",
    description:
      "Comedy is the hardest genre and you respect that. Sharp scripts, sharper timing, a quote ready for everything.",
    genre: "Comedy",
    bg: "#1B1606",
    ink: "#FFF1B0",
    accent: "#FFD23D",
    signatureFilms: ["The Grand Budapest Hotel", "Superbad", "What We Do in the Shadows"],
    mood: ["Quick", "Warm", "Light"],
  },
  {
    id: "indie-soul",
    title: "The Indie Soul",
    titleHy: "Ինդի հոգին",
    tagline: "You go to the cinema to be argued with.",
    description:
      "Cult, indie, the festival circuit, the films your friends don't want to watch. You came for the discomfort.",
    genre: "Indie",
    bg: "#160B22",
    ink: "#F0E6D2",
    accent: "#B388FF",
    signatureFilms: ["The Lighthouse", "Beau Is Afraid", "Good Time"],
    mood: ["Curious", "Stubborn", "Alive"],
  },
];

/* ── Behaviour Badges ────────────────────────────────────────────────── */

export type Badge = {
  id: string;
  /** Short label shown on the card pill */
  label: string;
  /** One-line description used in motivation copy */
  description: string;
};

// IMAX is intentionally absent — KinoPark doesn't run IMAX screens. "The
// Regular" replaces it as the eighth badge.
export const BADGES: Badge[] = [
  {
    id: "premium-baby",
    label: "Premium Baby",
    description: "Recliner seats, the good rows, every time.",
  },
  {
    id: "marathoner",
    label: "Marathoner",
    description: "You came back this Saturday too.",
  },
  {
    id: "date-night",
    label: "Date Night",
    description: "Two tickets, weekend, Friday seven PM.",
  },
  {
    id: "lone-wolf",
    label: "Lone Wolf",
    description: "One ticket. The middle seat. Perfect.",
  },
  {
    id: "front-row",
    label: "Front Row",
    description: "Opening weekend or you're not interested.",
  },
  {
    id: "weekday-wizard",
    label: "Weekday Wizard",
    description: "Tuesday matinee. Empty hall. You've got it figured out.",
  },
  {
    id: "popcorn-loyalist",
    label: "Popcorn Loyalist",
    description: "Large salted, every screening. No notes.",
  },
  {
    id: "the-regular",
    label: "The Regular",
    description: "Every month without fail. The staff know your name.",
  },
];

/* ── Stats (trimmed: 3 not 4) ────────────────────────────────────────── */

export type CardStats = {
  /** Lifetime tickets purchased */
  moviesWatched: number;
  /** Percentage of tickets that were premium / recliner */
  premiumPct: number;
  /** Top-genre share — usually echoes the archetype */
  topGenrePct: number;
};

/* ── Insight ─────────────────────────────────────────────────────────── */

/**
 * One observed fact per user, picked deterministically from a library of
 * templates and filled with their data. Insights MUST feel specific — like
 * a friend who's been paying attention. Generic ("you watch a lot of
 * drama") is forbidden — the archetype + stats already say that.
 */

const HALL_NAMES = ["Hall 1", "Hall 2", "Hall 3"] as const;
const ROW_LETTERS = ["C", "D", "E", "F", "G", "H"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

type InsightCtx = {
  /** Hash-derived integer, used to pick from arrays */
  pick: (n: number) => number;
  archetype: Archetype;
  stats: CardStats;
};

type InsightTemplate = {
  id: string;
  /** Build the insight string from context, or return null if unsuitable */
  build: (ctx: InsightCtx) => string | null;
};

const INSIGHT_TEMPLATES: InsightTemplate[] = [
  {
    id: "three-in-a-day",
    build: ({ pick }) => {
      const day = 1 + pick(28);
      const month = MONTHS[pick(12)];
      return `Three films in one day — ${month} ${day}.`;
    },
  },
  {
    id: "weekend-streak",
    build: ({ pick }) => {
      const weeks = 6 + pick(20); // 6–25 weeks
      return `${weeks} ${WEEKDAYS[5 + pick(2)]}s in a row — never missed one.`;
    },
  },
  {
    id: "milestone-ticket",
    build: ({ pick, archetype }) => {
      const milestone = [50, 100, 150, 200][pick(4)];
      const film = archetype.signatureFilms[pick(3)];
      return `Your ${milestone}th ticket was “${film}”.`;
    },
  },
  {
    id: "genre-binge",
    build: ({ pick, archetype }) => {
      const count = 5 + pick(8); // 5–12
      const month = MONTHS[pick(12)];
      return `${count} ${archetype.genre.toLowerCase()} films in ${month} — coincidence?`;
    },
  },
  {
    id: "favourite-seat",
    build: ({ pick }) => {
      const hall = HALL_NAMES[pick(3)];
      const row = ROW_LETTERS[pick(6)];
      const seat = 6 + pick(10); // 6–15
      return `Your most-watched seat: ${hall}, Row ${row}, seat ${seat}.`;
    },
  },
  {
    id: "same-day-rewatch",
    build: ({ pick, archetype }) => {
      const film = archetype.signatureFilms[pick(3)];
      return `You came back the same day to watch “${film}” twice.`;
    },
  },
  {
    id: "perfect-month-streak",
    build: ({ pick }) => {
      const months = 3 + pick(7); // 3–9 months
      return `A ${months}-month streak — perfect attendance.`;
    },
  },
  {
    id: "first-premium",
    build: ({ pick }) => {
      const month = MONTHS[pick(12)];
      const yr = 23 + pick(3); // '23–'25
      return `Your first premium seat: ${month} '${yr}.`;
    },
  },
  {
    id: "favourite-director",
    build: ({ pick, archetype }) => {
      const directors: Record<string, string[]> = {
        cinephile: ["Wong Kar-wai", "Andrei Tarkovsky", "Terrence Malick", "Yorgos Lanthimos"],
        "anime-devotee": ["Hayao Miyazaki", "Makoto Shinkai", "Mamoru Hosoda"],
        "drama-queen": ["Noah Baumbach", "Kenneth Lonergan", "Celine Song", "Asghar Farhadi"],
        "horror-junkie": ["Ari Aster", "Robert Eggers", "Jordan Peele", "Mike Flanagan"],
        "scifi-nerd": ["Denis Villeneuve", "Christopher Nolan", "Alex Garland"],
        "action-hero": ["George Miller", "Chad Stahelski", "Christopher McQuarrie"],
        sleuth: ["David Fincher", "Bong Joon-ho", "Denis Villeneuve"],
        "hopeless-romantic": ["Richard Linklater", "Nora Ephron", "Damien Chazelle"],
        "comedy-captain": ["Wes Anderson", "Taika Waititi", "Greta Gerwig"],
        "indie-soul": ["Robert Eggers", "Ari Aster", "Sean Baker"],
      };
      const list = directors[archetype.id] ?? ["Denis Villeneuve"];
      return `Your most-watched director: ${list[pick(list.length)]}.`;
    },
  },
  {
    id: "weekend-variety",
    build: () => "Three weekends, three different genres — and three different reactions.",
  },
  {
    id: "advance-booker",
    build: ({ pick }) => {
      const days = 3 + pick(8); // 3–10 days
      return `You book ${days} days in advance, on average. Disciplined.`;
    },
  },
  {
    id: "busiest-month",
    build: ({ pick }) => {
      const month = MONTHS[pick(12)];
      const yr = 24 + pick(2); // '24–'25
      const count = 5 + pick(7); // 5–11
      return `Your busiest month: ${month} '${yr} — ${count} films.`;
    },
  },
  {
    id: "late-show-loyalist",
    build: () => "You always pick the last show of the night. Always.",
  },
];

/* ── Helpers ────────────────────────────────────────────────────────── */

export function getArchetype(id: string): Archetype | undefined {
  return ARCHETYPES.find((a) => a.id === id);
}

export function getBadge(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function pickRandomArchetype(seed: string): Archetype {
  return ARCHETYPES[hash(seed) % ARCHETYPES.length];
}

export function pickRandomBadge(seed: string): Badge {
  return BADGES[hash(seed + ":badge") % BADGES.length];
}

export function buildStats(seed: string, _archetype: Archetype): CardStats {
  const a = hash(seed + ":a");
  const b = hash(seed + ":b");
  const c = hash(seed + ":c");

  const moviesWatched = 12 + (a % 140); // 12 – 152
  const premiumPct = 18 + (b % 78); // 18 – 96
  const topGenrePct = 32 + (c % 48); // 32 – 80
  return { moviesWatched, premiumPct, topGenrePct };
}

/**
 * Pick one insight template by hash, then expand it. The seed-derived
 * `pick` keeps every template field stable for a given user, so refreshing
 * the page never changes the insight wording.
 */
export function buildInsight(seed: string, archetype: Archetype, stats: CardStats): string {
  const tplIdx = hash(seed + ":insight") % INSIGHT_TEMPLATES.length;
  const tpl = INSIGHT_TEMPLATES[tplIdx];

  // Local PRNG: per-call counter so each `pick` advances deterministically
  // without coupling templates to a global RNG state.
  let counter = hash(seed + ":insight-pick");
  const pick = (n: number): number => {
    counter = (counter * 1103515245 + 12345) | 0;
    return Math.abs(counter) % n;
  };

  const result = tpl.build({ pick, archetype, stats });
  return result ?? `Your top genre is ${archetype.genre} — ${stats.topGenrePct}%.`;
}
