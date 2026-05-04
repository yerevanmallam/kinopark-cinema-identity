import { NextResponse } from "next/server";
import {
  ARCHETYPES,
  BADGES,
  buildInsight,
  buildStats,
  pickRandomArchetype,
  pickRandomBadge,
  type Archetype,
  type Badge,
  type CardStats,
} from "@/lib/archetypes";

/**
 * Mock /api/generate.
 *
 * Returns the user's KinoPark Cinema Identity:
 *   - archetype  : taste signature (Drama Queen, Sci-Fi Nerd, …)
 *   - badge      : behaviour signature (Premium Baby, Marathoner, …)
 *   - stats      : { moviesWatched, premiumPct, topGenrePct }
 *   - insight    : one observed-fact line, Spotify-Wrapped style
 *   - serial     : stable per-phone card number
 *   - motivation : copy that ties archetype + badge together
 *
 * When the real watch-history endpoint ships, replace `pickRandom*`,
 * `buildStats`, and `buildInsight` with classifiers fed by ticket data.
 * The response shape stays identical.
 */

export type ApiResponse = {
  archetype: Archetype;
  badge: Badge;
  stats: CardStats;
  insight: string;
  serial: string;
  motivation: string;
};

const ARCHETYPE_LINES: Record<string, string> = {
  cinephile: "You don't watch films, you study them. Your last six tickets read like a syllabus.",
  "anime-devotee": "Half your favourite scenes are silent. You came for the worlds, not the words.",
  "drama-queen": "You buy popcorn anyway, even though you'll be too busy crying to eat it.",
  "horror-junkie": "You came alone, on purpose. The lights went down and you smiled.",
  "scifi-nerd": "Other people pick a film. You pick a future. Your watch history reads like research.",
  "action-hero": "Sound system on, lights down, phone face-down. You are the reason the back row exists.",
  sleuth: "You hate trailers because they spoil. You love long shots because they don't.",
  "hopeless-romantic": "You bought two tickets even though you came alone — old habit. Train scenes still hit.",
  "comedy-captain": "You laugh first, loudest, and at the line before the punchline.",
  "indie-soul": "If a film has under 50,000 ratings, you're already in.",
};

const BADGE_LINES: Record<string, string> = {
  "premium-baby": "And you book the recliner every single time. Of course you do.",
  marathoner: "Three films a week, easily. The staff know your order.",
  "date-night": "Always two tickets. Weekend, evening. The popcorn arrives without being asked.",
  "lone-wolf": "One ticket, middle seat, no notes. You came to be alone in the dark.",
  "front-row": "Opening weekend or it can wait — but it usually can't.",
  "weekday-wizard": "Tuesday matinee, empty hall. You figured the secret out years ago.",
  "popcorn-loyalist": "Large salted, every time. The combo barely needs ordering.",
  "the-regular": "Every month without fail. The staff know your name.",
};

function generateSerial(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return ((Math.abs(h) % 9000) + 1000).toString();
}

function isValidPhone(p: string): boolean {
  return /^\+374\d{8}$/.test(p);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone")?.trim() ?? "";
  const archetypeOverride = url.searchParams.get("archetype")?.trim();
  const badgeOverride = url.searchParams.get("badge")?.trim();

  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Enter a valid Armenian mobile number." },
      { status: 400 },
    );
  }

  // Mock latency so the UI's analysis sequence has something to land on.
  await new Promise((r) => setTimeout(r, 300));

  const forcedArch = archetypeOverride
    ? ARCHETYPES.find((a) => a.id === archetypeOverride)
    : null;
  const forcedBadge = badgeOverride ? BADGES.find((b) => b.id === badgeOverride) : null;

  const archetype = forcedArch ?? pickRandomArchetype(phone);
  const badge = forcedBadge ?? pickRandomBadge(phone);
  const stats = buildStats(phone, archetype);
  const insight = buildInsight(phone, archetype, stats);
  const serial = generateSerial(phone);
  const motivation = `${ARCHETYPE_LINES[archetype.id]} ${BADGE_LINES[badge.id]}`;

  const body: ApiResponse = { archetype, badge, stats, insight, serial, motivation };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
