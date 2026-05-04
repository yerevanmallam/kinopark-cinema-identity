# Cinema Identity — Card v2 (Insights Edition)

**Date:** 2026-05-04
**Status:** Design approved by user — execution in progress

## Problem with v1

v1 ported the limitless-card pattern faithfully — four big stats + best-month pill — but the card felt **clever, not personal**. Stats are necessary but not sufficient: the user wants the card to *tell them something they didn't know about themselves*. v1 had:

- Generic archetype names ("The Heart", "The Visionary") — character-card-game flavour but not punchy.
- Four numeric stats — the second pair felt like padding.
- A "best month" pill that said `Sept '25 — 7 movies` — informative but not a *story*.
- "IMAX Only" badge — KinoPark doesn't have IMAX. Reference to a thing the brand doesn't sell is a credibility break.
- Wrong logo — two circles with `mix-blend-mode: screen` produced a muddy overlap. The real kinopark.am logo is two solid discs.

## v2 design

### Layout (16:9, container-query units)

```
┌─────────────────────────────────────────────────────┐
│ 🟠🟢 KINOPARK · CINEMA IDENTITY      ◆ DATE NIGHT   │  top strip
│                                                     │
│ YOUR CHARACTER · DRAMA                              │  eyebrow (accent)
│                                                     │
│ DRAMA QUEEN                                         │  title
│ Դրամա Թագուհի                                       │  Armenian sub
│                                                     │
│ "If it doesn't make you cry, it isn't trying."      │  tagline
│                                                     │
│  47           62%           58%                     │  3 stats
│  MOVIES       PREMIUM       DRAMA                   │
│  WATCHED      SEATS         SHARE                   │
│                                                     │
│ ✦ Three films in one day — October 4                │  insight pill
│                                                     │
│ N° 5418 / 2026                  KINOPARK.AM         │  footer
└─────────────────────────────────────────────────────┘
```

### Archetypes (10) — renamed for personality

| Old | New | Genre |
|---|---|---|
| The Auteur | **The Cinephile** | Art-house |
| The Dreamer | **Anime Devotee** | Anime |
| The Heart | **Drama Queen** | Drama |
| The Phantom | **Horror Junkie** | Horror |
| The Visionary | **Sci-Fi Nerd** | Sci-Fi |
| The Adrenaline | **Action Hero** | Action |
| The Detective | **The Sleuth** | Thriller |
| The Romantic | **Hopeless Romantic** | Romance |
| The Jester | **Comedy Captain** | Comedy |
| The Rebel | **The Indie Soul** | Indie |

Palettes stay (dark-tinted base + bright accent per archetype).

### Badges (8) — drop IMAX, add The Regular

`premium-baby`, `marathoner`, `date-night`, `lone-wolf`, `front-row`, `weekday-wizard`, `popcorn-loyalist`, `the-regular`.

`the-regular` description: "Every month without fail. The staff know your name."

### Stats — trimmed 4 → 3

1. **Movies Watched** — lifetime ticket count
2. **Premium Seats** — % of tickets that were premium / recliner
3. **{Genre} Share** — % of tickets that were the user's top genre (which usually echoes the archetype)

The fourth stat (Per Month average) was redundant with Movies Watched + life-on-platform context the user can intuit.

### Insight — the soul of the card

One signature line per user, picked deterministically from ~12 templates and filled with their data:

```
✦ Three films in one day — October 4
✦ 12 Saturdays in a row — never missed one
✦ Your 100th ticket was Past Lives
✦ 9 horror films in October — coincidence?
✦ Your most-watched seat: Hall 3, Row F
✦ You came back the same day to watch Dune twice
✦ A 4-month streak — perfect attendance
✦ You bought your first premium seat in March '25
✦ Your most-watched director: Denis Villeneuve
✦ Three weekends, three different genres
✦ You always book between 2 and 4 hours before showtime
✦ Sept '25: your busiest month — 7 films
```

Insights MUST feel specific, observed, and slightly cheeky — like a friend who's been paying attention. Generic insights ("you watch a lot of drama") are forbidden.

### Logo — corrected

The kinopark.am logo is **two solid coloured discs** (orange `#CA4C16` + yellow-green `#A8C53C`) sitting next to each other with a small overlap, then "KINOPARK" wordmark. **No mix-blend-mode.** No screen blend. Two opaque circles, the green disc sits *on top of* the orange one with their right/left edges tangent or slightly overlapping.

## API response shape

```ts
type ApiResponse = {
  archetype: Archetype;
  badge: Badge;
  stats: { moviesWatched: number; premiumPct: number; topGenreShare: number };
  insight: string;       // already-formatted string, e.g. "Three films in one day — October 4"
  serial: string;
  motivation: string;    // longer copy that ties archetype + badge for below-card display
};
```

## Out of scope for v2

- Server-rendered share PNG (`/api/card-image`) — defer until brand sign-off on v2.
- Real watch-history classifier — stays mocked. The deterministic-by-phone hash for archetype/badge/insight stands until KinoPark exposes the data API.
- "What's missing from v3" notes belong in a future spec.

## Files affected

- `src/lib/archetypes.ts` — rename archetypes, swap IMAX for Regular, add insight templates + generator, drop fourth stat (`perMonth` and `bestMonth`) from `CardStats`.
- `src/app/api/generate/route.ts` — return `insight` instead of `bestMonth`, simplify stat calc.
- `src/components/MovieCard.tsx` — three stats not four, replace best-month pill with insight callout, fix `KinoLogo` (drop blend mode).
- `src/components/PageClient.tsx` — type update, fix `KinoLogo` in nav.
- `src/components/CardBack.tsx` — same logo fix.
- `src/app/deck/page.tsx` — insight + 3 stats.

## Acceptance

A user lands on `/`, types their phone, hits submit, and sees:

- Their named archetype (e.g. **DRAMA QUEEN**) in huge bold type with the right palette.
- An orange behaviour badge that fits the brand (no IMAX anywhere).
- Three crisp stats.
- One concrete, surprising insight line — *not* a stat, a story.
- A correctly-rendered KinoPark logo in nav and on card.
- A motivation line under the card that combines the archetype voice and the badge voice.
