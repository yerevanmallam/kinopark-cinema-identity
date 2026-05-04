# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install            # install deps
npm run dev            # dev server on http://localhost:3010 (NOT 3000 — port is set in package.json)
npm run build          # production build (must pass before pushing significant changes)
npm start              # serve production build
npm run lint           # eslint
```

There are no tests in this repo yet. The reveal flow is verified by hand against `http://localhost:3010` (submit any 8-digit phone — same phone always returns the same archetype/badge/insight).

## What this app does

Phone-number-keyed cinema-character cards for KinoPark, modelled after `limitless-trader-card`. User submits a phone, the API returns a *taste* archetype + a *behaviour* badge + 3 stats + 1 insight line. The reveal page shows a card.

The classifier is currently **mocked** — `pickRandomArchetype`, `pickRandomBadge`, and `buildInsight` in `src/lib/archetypes.ts` are deterministic-by-phone hashes. When the real watch-history API ships, swap those three functions with classifiers fed by ticket data. The `ApiResponse` shape (in `src/app/api/generate/route.ts`) is the contract the UI depends on — keep it identical.

## High-level architecture

### State machine — `src/components/PageClient.tsx`

```
landing → loading → revealing → result
                           ↓
                          error
```

Drives the entire page. Six analysis-step labels animate while the API resolves; then `triggerReveal` schedules a flash bloom + card flip + screen shake on a 1.4 s timeline before settling on `result`. Cleanup is per-effect via `revealTimeouts.current`.

### Two-axis classification — `src/lib/archetypes.ts`

- 10 **archetypes** (taste): Drama Queen, Horror Junkie, Sci-Fi Nerd, etc. Each owns a `bg` + `ink` + `accent` colour triple.
- 8 **badges** (behaviour): Premium Baby, Marathoner, Date Night, Lone Wolf, Front Row, Weekday Wizard, Popcorn Loyalist, The Regular. **No IMAX** — KinoPark doesn't have IMAX.
- ~14 **insight templates**, picked per-user, filled with their data ("Three films in one day — October 4", "Your most-watched director: …"). Insights MUST feel observed and specific. Generic ones are forbidden.

The `hash(seed)` helper deterministically picks all three so refreshing never changes a user's reading.

### Card rendering — `src/components/MovieCard.tsx`

- 16:9 aspect ratio for shareable social unfurl.
- All sizing in **container query units (`cqw`)** — never hard-code `px` inside MovieCard. Container queries are the only way the card scales correctly across landing thumb, deck preview, and the eventual server-rendered share PNG.
- The text-on-accent colour is computed via YIQ luminance (`contrastInk`) so palette changes don't break readability.

### Card flip — `src/components/CardScene.tsx`

Uses `framer-motion`'s `AnimatePresence` to swap between `CardBack` and `MovieCard` with a flash + spring. **This is the only place AnimatePresence is used** — see "gotchas" below.

## Gotchas / non-obvious things

- **Hydration mismatches with framer-motion + Next 16**: `motion.div` writes its `initial` styles in slightly different formats on server vs client (`opacity: "0"` vs `opacity: 0`), and the resulting hydration error breaks event handlers downstream — most visibly, the form submit button stops firing the React onSubmit. **Fix:** stage transitions in `PageClient.tsx` are plain conditional renders + a CSS `fade-in` keyframe (in `globals.css`), NOT `AnimatePresence`. The card flip in `CardScene` is the only motion-driven transition. Don't reintroduce `AnimatePresence` at the page level.
- **Brand tokens are non-negotiable**: pure-dark `#0A0A0A` background, near-white `#FCFCFD` text, KP orange `#CA4C16` for all CTAs (40 px pill radius), green `#A8C53C` for eyebrow labels. All extracted from kinopark.am directly. Per-archetype palettes are confined to the cards themselves.
- **Display headlines** use `.kp-display` (Inter 800, uppercase). **No serif, no italic.** kinopark.am is bold-sans uppercase end-to-end.
- **The KinoPark logo** (`KinoLogo.tsx`) is the actual SVG from the site (three trees + wordmark). It is NOT two circles. Don't apply `mix-blend-mode` to it.
- **Dev port is 3010**. The `package.json` script sets it explicitly because port 3000 is often taken on dev machines.
- **The dev server intermittently caches stale Turbopack errors** that no longer match the file. If a "compile error" persists across saves, `rm -rf .next` and restart fixes it.

## Routes

- `/` — landing → submit phone → reveal card → share
- `/deck` — all 10 archetype cards in a grid (marketing + design preview)
- `/api/generate?phone=+374XXXXXXXX[&archetype=ID][&badge=ID]` — JSON of `{ archetype, badge, stats, insight, serial, motivation }`. The `archetype` and `badge` params each force a specific value (independent of the others) and are handy for marketing-asset generation.

## Spec / design history

`docs/superpowers/specs/2026-05-04-card-v2-insights-design.md` documents why the card was redesigned (v1 had too-generic archetype names, IMAX badge that the brand doesn't sell, mismatched logo, no insight line). Read it before proposing structural changes to the card.
