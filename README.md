# KinoPark — Cinema Identity

Phone number → cinema-character card with **stats** (limitless trader-card style) wrapped in **kinopark.am's brand language**. Two-axis classification: a *taste* archetype × a *behaviour* badge.

## How it works

```
phone (+374 XX XX XX XX) ─▶ /api/generate ─▶ classify ─▶ render card ─▶ share
```

1. User submits an Armenian mobile number on `/`.
2. `/api/generate?phone=...` returns:
   - `archetype` — taste signature (e.g. **The Visionary**)
   - `badge` — behaviour signature (e.g. **Premium Baby**, **Marathoner**, **Date Night**)
   - `stats` — `moviesWatched`, `premiumPct`, `perMonth`, `bestMonth`, `topGenre`
   - `motivation` — copy that ties archetype + badge together
   - `serial` — stable per-phone card number
3. The card-scene plays a 6-step "reading" sequence, then flips to reveal the front with a flash bloom.
4. The revealed card shows the four big stats (limitless-style), a best-month pill, the orange behaviour badge, and the brand mark.

The classifier is currently a deterministic-by-phone hash. When the watch-history API ships, replace `pickRandomArchetype`, `pickRandomBadge`, and `buildStats` in `src/lib/archetypes.ts` with real classifiers. The response shape doesn't change, so the UI doesn't move.

## 10 archetypes × 8 badges = 80 unique cards

Defined in [`src/lib/archetypes.ts`](src/lib/archetypes.ts). All archetypes share a dark base + a bright accent — the accent lights up the stats labels, the best-month pill, and the brand stripe.

**Archetypes (taste):**

| ID | Title | Genre | Accent |
|---|---|---|---|
| `auteur` | The Auteur | Art-house | Champagne gold |
| `dreamer` | The Dreamer | Anime | Pink |
| `heart` | The Heart | Drama | Red |
| `phantom` | The Phantom | Horror | Blood red |
| `visionary` | The Visionary | Sci-Fi | Cyan |
| `adrenaline` | The Adrenaline | Action | Orange |
| `detective` | The Detective | Thriller | Gold |
| `romantic` | The Romantic | Romance | Pink-magenta |
| `jester` | The Jester | Comedy | Yellow |
| `rebel` | The Rebel | Indie | Lavender |

**Badges (behaviour):** `premium-baby`, `marathoner`, `date-night`, `lone-wolf`, `front-row`, `weekday-wizard`, `popcorn-loyalist`, `imax-only`.

Run `/deck` to see all ten archetypes side-by-side, each paired with a different badge.

## Tech stack

- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript 5
- Tailwind CSS v4
- Framer Motion — flip + flash + tilt
- Inter (display, weight 800) + Poppins (body) — open-source substitutes for KinoPark's Proxima Nova Sans + Poppins pairing

No env vars. No keys.

## Brand tokens

Lifted directly from kinopark.am:

| Token | Value |
|---|---|
| `bg` | `#0A0A0A` pure dark |
| `text` | `#FCFCFD` near-white |
| `orange` (primary CTA) | `#CA4C16` |
| `green` (eyebrow / labels) | `#A8C53C` |
| `panel` | `#0F1620` dark navy panels |
| `teal-glow` | `#1A5A56` atmospheric corner glow |
| Pill button radius | `40px` |
| Display headlines | `kp-display` — Inter 800 UPPERCASE |

## Routes

- `/` — landing → submit phone → reveal card → share
- `/deck` — all 10 archetype cards in a grid (marketing + design preview)
- `/api/generate?phone=+374XXXXXXXX[&archetype=ID][&badge=ID]` — JSON of `{ archetype, badge, stats, motivation, serial }`. The `archetype` and `badge` params each force a specific value (independent of the others) and are handy for marketing-asset generation. Try `/?archetype=visionary&badge=premium-baby`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3010
```

```bash
npm run build
npm start
```

## Project structure

```
src/
├── app/
│   ├── page.tsx                 # entry → PageClient under Suspense
│   ├── layout.tsx               # fonts, metadata
│   ├── globals.css              # theme tokens, card animations, page grain
│   ├── deck/page.tsx            # full-deck preview
│   └── api/generate/route.ts    # mock classifier
├── components/
│   ├── PageClient.tsx           # state machine: landing → loading → revealing → result
│   ├── MovieCard.tsx            # the card front (per-archetype palette)
│   ├── CardBack.tsx             # cinema-curtain back face
│   ├── CardScene.tsx            # tilt + flip + charging + flash
│   ├── PhoneInput.tsx           # +374 8-digit input
│   └── DustField.tsx            # ambient projector-beam dust motes
└── lib/
    └── archetypes.ts            # 10 archetypes + deterministic picker
```

## Replacing the mock with the real API

Swap the body of `GET` in [`src/app/api/generate/route.ts`](src/app/api/generate/route.ts):

```ts
const watchHistory = await fetchKinoParkHistory(phone);
const archetype = classifyFromHistory(watchHistory);
const motivation = await generateMotivation(watchHistory, archetype); // optional
const serial = generateSerial(phone);
```

The frontend's `ApiResponse` shape stays identical. Don't change the shape — `MovieCard` reads `archetype.{title,titleHy,tagline,description,genre,bg,ink,accent,signatureFilms,mood}` directly.

## Notes for AI coding assistants

- The card layout uses container queries (`cqw`). Don't introduce hardcoded `px` inside `MovieCard.tsx` — it'll break the responsive scaling on mobile and the eventual server-rendered share PNG.
- The state machine (`landing → loading → revealing → result`) is timing-coupled to the analysis steps. If you change the steps, also update `STEP_DURATION` and the reveal timeouts in `triggerReveal`.
- Brand accent is `#CA4C16` (orange) and background is `#0A0A0A` (pure dark) — these are non-negotiable, lifted from kinopark.am. All chrome (nav, hero CTA, share buttons) uses `.kp-pill` which maps to a 40px-radius orange button matching the site exactly.
- Per-archetype palettes are confined to the cards themselves. The chrome around the cards (page bg, nav, buttons, headlines) follows KinoPark's brand exactly.
- Display headlines must use `.kp-display` (`font-display: var(--font-display)` + bold + uppercase). Don't reach for serif or italic — kinopark.am is bold-sans uppercase end-to-end.
