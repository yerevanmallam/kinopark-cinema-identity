# Story Modal + Loyalty Rewards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken off-screen "Save Story" flow with a modal preview that doubles as the html-to-image render target, and turn the promocode into a typed loyalty reward (per-archetype default + URL override).

**Architecture:** `Reward` becomes a first-class data type in `archetypes.ts` (pool of 9 reward types). API returns it alongside `promocode`. A new `RewardModal` component renders the 9:16 story card at full 1080×1920 px, scaled visually with CSS transform; html-to-image captures the un-transformed inner DOM to produce a crisp PNG. The 16:9 reveal card simplifies (no more provisional promo row) and gets a small "Loyalty perk inside ↓" hint above the action buttons.

**Tech Stack:** Next.js 16 + React 19 + TypeScript 5 · framer-motion (existing) · html-to-image (already installed) · Tailwind v4 (existing). **No test framework.** Per-task verification: `npm run build` clean + manual smoke test against `http://localhost:3010` (dev port set in `package.json`).

**Spec:** `docs/superpowers/specs/2026-05-04-story-modal-loyalty-rewards.md`

---

## Task 1: Reward data model + helpers in `archetypes.ts`

**Files:**
- Modify: `src/lib/archetypes.ts`

- [ ] **Step 1.1: Add the `Reward` type and `REWARDS` pool**

Insert immediately after the `BADGES` array (after the closing `];` on the line where `BADGES` ends — currently around line 234) and before the `/* ── Stats (trimmed: 3 not 4) ──` comment:

```ts
/* ── Loyalty Rewards ────────────────────────────────────────────────── */

export type Reward = {
  id: string;
  /** Headline on the card. Short. UPPERCASE works (rendered uppercase). */
  label: string;
  /** One-line flavour shown above the label. Specific > generic. */
  flair: string;
  /** Redemption instruction shown under the code pill. */
  redemption: string;
};

/**
 * The reward pool. The first 7 are mapped to archetypes as defaults; the
 * last 2 are marketing-only — only reachable via `?reward=…` overrides.
 *
 * Adding a new reward: append it here, then either map an archetype's
 * `defaultRewardId` to it (becomes a default) or leave it marketing-only.
 */
export const REWARDS: Reward[] = [
  {
    id: "free-popcorn",
    label: "Free Large Popcorn",
    flair: "Large salted, every screening.",
    redemption: "Show this code at the snack bar",
  },
  {
    id: "premium-upgrade",
    label: "Premium Recliner Upgrade",
    flair: "The recliner row, on the house.",
    redemption: "Apply at booking — auto-upgrades the next premium seat",
  },
  {
    id: "free-combo",
    label: "Free Snack Combo",
    flair: "Popcorn and a drink — one ticket, full ritual.",
    redemption: "Show this code at the snack bar",
  },
  {
    id: "free-late-show",
    label: "Free Late-Show Ticket",
    flair: "After 22:00, the cinema is yours.",
    redemption: "Redeem at the box office for any late-night screening",
  },
  {
    id: "bogo-weekday",
    label: "Buy One, Get One Weekday",
    flair: "Tuesday matinee. Empty hall. Plus one.",
    redemption: "Apply at checkout, Mon–Thu screenings",
  },
  {
    id: "free-drink",
    label: "Free Drink",
    flair: "A quiet sip for the slow burn.",
    redemption: "Show this code at the snack bar",
  },
  {
    id: "date-night",
    label: "Date Night — 2 Tickets",
    flair: "Two tickets, weekend, evening.",
    redemption: "Redeem at the box office, weekend evening shows",
  },
  // — Marketing-only rewards (URL ?reward=…)
  {
    id: "double-points",
    label: "Double Loyalty Points",
    flair: "Every ticket counts twice — for 30 days.",
    redemption: "Auto-applies to every purchase on your account",
  },
  {
    id: "twenty-off-any",
    label: "20% Off Any Ticket",
    flair: "Any film, any seat, twenty off.",
    redemption: "Apply at checkout — no minimums",
  },
];
```

- [ ] **Step 1.2: Add `defaultRewardId` to the `Archetype` type**

Find the `Archetype` type near the top of the file. Add the field as the LAST property (after `mood`):

```ts
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
  /** Default loyalty reward when no `?reward=` override is set. */
  defaultRewardId: string;
};
```

- [ ] **Step 1.3: Set `defaultRewardId` on each of the 10 archetypes**

Update the `ARCHETYPES` array: add `defaultRewardId: "<id>"` as the last property in each of the 10 entries. Mapping:

| Archetype id | `defaultRewardId` |
|---|---|
| `cinephile` | `premium-upgrade` |
| `anime-devotee` | `free-combo` |
| `drama-queen` | `free-popcorn` |
| `horror-junkie` | `free-late-show` |
| `scifi-nerd` | `premium-upgrade` |
| `action-hero` | `bogo-weekday` |
| `sleuth` | `free-drink` |
| `hopeless-romantic` | `date-night` |
| `comedy-captain` | `free-popcorn` |
| `indie-soul` | `bogo-weekday` |

For each archetype object, add the new field after the `mood` line. Example for `cinephile`:

```ts
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
    defaultRewardId: "premium-upgrade",
  },
```

Repeat for the other 9 archetypes using the mapping table above.

- [ ] **Step 1.4: Add the `pickReward` helper**

Insert immediately after the `buildPromocode` function (search for `export function buildPromocode` to find it; add the new function below the closing `}` of `buildPromocode`):

```ts
/**
 * Resolve which reward to show. Marketing's `?reward=…` URL param force-
 * overrides; otherwise we use the archetype's `defaultRewardId`.
 *
 * Override is sanitized (lower-case, alnum + dash only) and validated
 * against the pool — unknown ids fall through to the default. This
 * matches how `?archetype=` and `?badge=` overrides behave.
 */
export function pickReward(archetype: Archetype, override?: string | null): Reward {
  if (override) {
    const safe = override.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const forced = REWARDS.find((r) => r.id === safe);
    if (forced) return forced;
  }
  const def = REWARDS.find((r) => r.id === archetype.defaultRewardId);
  if (!def) {
    // Defensive: every archetype should map to a real reward. If a typo
    // slips into a defaultRewardId, fall back to the first reward in the
    // pool rather than throw — keeps the API working in production.
    return REWARDS[0];
  }
  return def;
}
```

- [ ] **Step 1.5: Verify types compile**

Run:

```bash
cd "/Users/nick/General/kp landing" && npx tsc --noEmit 2>&1
```

Expected: no errors. If you see `Property 'defaultRewardId' is missing` errors, you missed an archetype in step 1.3 — go back and add it.

- [ ] **Step 1.6: Commit**

```bash
cd "/Users/nick/General/kp landing" && git add src/lib/archetypes.ts && git commit -m "$(cat <<'EOF'
Add Reward type, REWARDS pool, defaultRewardId, pickReward helper

Pool of 9 rewards (7 archetype defaults + 2 marketing-only). Each
archetype now maps to a default reward; pickReward resolves the
final pick, with optional URL-param override (sanitised + validated
against the pool, unknown ids fall back to the default).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: API route returns `reward`

**Files:**
- Modify: `src/app/api/generate/route.ts`

- [ ] **Step 2.1: Add `Reward` and `pickReward` to the imports**

Replace the existing import block at the top:

```ts
import { NextResponse } from "next/server";
import {
  ARCHETYPES,
  BADGES,
  buildInsight,
  buildPromocode,
  buildStats,
  pickRandomArchetype,
  pickRandomBadge,
  pickReward,
  type Archetype,
  type Badge,
  type CardStats,
  type Reward,
} from "@/lib/archetypes";
```

- [ ] **Step 2.2: Add `reward` to `ApiResponse`**

Replace the `ApiResponse` type:

```ts
export type ApiResponse = {
  archetype: Archetype;
  badge: Badge;
  stats: CardStats;
  insight: string;
  serial: string;
  motivation: string;
  /** Per-user promocode. Marketing can override with `?promo=KPVIP10`. */
  promocode: string;
  /** Loyalty reward this code unlocks. Override with `?reward=<id>`. */
  reward: Reward;
};
```

- [ ] **Step 2.3: Read the `?reward=` URL param**

In `GET(req)`, find the existing `promoOverride` line and add a sibling line:

```ts
  const promoOverride = url.searchParams.get("promo")?.trim();
  const rewardOverride = url.searchParams.get("reward")?.trim();
```

- [ ] **Step 2.4: Build and include the reward in the response**

Find the block where `promocode` is computed and add `reward` resolution right after it. Replace:

```ts
  const promocode = promoOverride
    ? promoOverride.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24)
    : buildPromocode(phone, archetype);

  const body: ApiResponse = { archetype, badge, stats, insight, serial, motivation, promocode };
```

with:

```ts
  const promocode = promoOverride
    ? promoOverride.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24)
    : buildPromocode(phone, archetype);
  const reward = pickReward(archetype, rewardOverride);

  const body: ApiResponse = {
    archetype,
    badge,
    stats,
    insight,
    serial,
    motivation,
    promocode,
    reward,
  };
```

- [ ] **Step 2.5: Verify the build is clean**

```bash
cd "/Users/nick/General/kp landing" && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`, all 5 routes listed, no TypeScript errors.

- [ ] **Step 2.6: Smoke-test the API**

Start the dev server in the background and curl the endpoint:

```bash
cd "/Users/nick/General/kp landing" && npm run dev > /tmp/kp-dev.log 2>&1 &
sleep 3
curl -s "http://localhost:3010/api/generate?phone=+37411223344" | python3 -m json.tool | head -50
```

Expected: JSON response includes a `reward` key like:
```json
"reward": {
  "id": "premium-upgrade",
  "label": "Premium Recliner Upgrade",
  "flair": "The recliner row, on the house.",
  "redemption": "Apply at booking — auto-upgrades the next premium seat"
}
```

Then test override:
```bash
curl -s "http://localhost:3010/api/generate?phone=+37411223344&reward=double-points" | python3 -c 'import sys,json; print(json.load(sys.stdin)["reward"]["id"])'
```
Expected output: `double-points`

Then test invalid override (should fall back to default):
```bash
curl -s "http://localhost:3010/api/generate?phone=+37411223344&reward=fake-reward" | python3 -c 'import sys,json; print(json.load(sys.stdin)["reward"]["id"])'
```
Expected output: NOT `fake-reward` (the archetype's `defaultRewardId` instead).

Stop the dev server when done:
```bash
pkill -f "next dev" 2>/dev/null; true
```

- [ ] **Step 2.7: Commit**

```bash
cd "/Users/nick/General/kp landing" && git add src/app/api/generate/route.ts && git commit -m "$(cat <<'EOF'
Wire reward into /api/generate

Accepts ?reward=<id> override (sanitised, validated against REWARDS),
falls back to the archetype's defaultRewardId. Reward is now part of
the ApiResponse contract.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Restructure `MovieCardStory` with the reward badge layout

**Files:**
- Modify: `src/components/MovieCardStory.tsx`
- Modify: `src/components/PageClient.tsx` (pass new prop)

- [ ] **Step 3.1: Update `MovieCardStory` props**

In `src/components/MovieCardStory.tsx`, replace the `Props` interface:

```ts
interface Props {
  archetype: Archetype;
  badge: Badge;
  stats: CardStats;
  insight: string;
  serial: string;
  promocode: string;
  /** The loyalty reward this code unlocks. Drives the reward badge block. */
  reward: Reward;
  /** Show the code crisp, or render it heavily blurred. Default: blurred. */
  revealCode?: boolean;
  /**
   * Optional path to a background image (placed under /public). When set, the
   * image is used as the card bg with a tinted gradient overlay for legibility.
   * When not set, falls back to the archetype's solid `bg` colour.
   */
  bgImageUrl?: string;
}
```

Then update the import to also bring in `Reward`:

```ts
import type { Archetype, Badge, CardStats, Reward } from "@/lib/archetypes";
```

Update the function signature destructuring to include `reward`:

```ts
export function MovieCardStory({
  archetype,
  badge,
  stats,
  insight,
  serial,
  promocode,
  reward,
  revealCode = false,
  bgImageUrl,
}: Props) {
```

- [ ] **Step 3.2: Replace the existing promo block with the reward badge block**

Find the existing block in `MovieCardStory.tsx` that starts with `{/* Promo block — boxed, prominent, with optional blur */}` and ends just before `{/* Footer: serial + url */}`. Replace the entire block with:

```tsx
        {/* Reward badge — the focal loyalty element. Picks up the per-user
            reward (or marketing override). Code pill blurs until the user
            toggles reveal in the modal. */}
        <div style={{ marginTop: "5cqw" }}>
          <div
            style={{
              color: ink,
              opacity: 0.65,
              fontSize: "2.4cqw",
              fontStyle: "italic",
              lineHeight: 1.35,
            }}
          >
            {reward.flair}
          </div>

          <div
            className="kp-display"
            style={{
              marginTop: "2cqw",
              fontSize: "9cqw",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: ink,
              display: "flex",
              alignItems: "center",
              gap: "1.6cqw",
              flexWrap: "wrap",
            }}
          >
            <span>{reward.label}</span>
            <span style={{ color: accent, fontSize: "8cqw", lineHeight: 1 }}>✦</span>
          </div>

          <div
            style={{
              marginTop: "1.5cqw",
              color: accent,
              fontSize: "2.4cqw",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {archetype.title} Exclusive
          </div>

          <div
            style={{
              marginTop: "3.5cqw",
              display: "inline-block",
              padding: "2.4cqw 3.6cqw",
              background: "#CA4C16",
              borderRadius: "2cqw",
              boxShadow: `0 0 6cqw ${withAlpha("#CA4C16", 0.35)}`,
            }}
          >
            <span
              className="kp-display"
              style={{
                color: "#FCFCFD",
                fontSize: "5cqw",
                letterSpacing: "0.1em",
                fontWeight: 800,
                fontFeatureSettings: "'tnum'",
                filter: revealCode ? "none" : "blur(11px)",
                transition: "filter 200ms ease",
                userSelect: revealCode ? "auto" : "none",
                display: "block",
              }}
            >
              {promocode}
            </span>
          </div>

          <div
            className="flex items-center justify-between"
            style={{
              marginTop: "2.5cqw",
              fontSize: "1.9cqw",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.55,
              fontWeight: 600,
              color: ink,
            }}
          >
            <span>{revealCode ? "Tap code to copy" : "Tap to copy"}</span>
            <span>Valid 30 days</span>
          </div>
        </div>
```

(Note: this replaces the previous `{/* Promo block */}` block in its entirety; the surrounding `{/* Insight callout */}` and `{/* Footer: serial + url */}` blocks stay untouched.)

- [ ] **Step 3.3: Pass `reward` from `PageClient` to `MovieCardStory`**

In `src/components/PageClient.tsx`, find the off-screen story render block (the one ref'd by `storyRef`). The block currently passes 7 props to `<MovieCardStory>`. Add `reward={data.reward}` before `revealCode={revealCode}`:

```tsx
        {data && (
          <MovieCardStory
            archetype={data.archetype}
            badge={data.badge}
            stats={data.stats}
            insight={data.insight}
            serial={data.serial}
            promocode={data.promocode}
            reward={data.reward}
            revealCode={revealCode}
            bgImageUrl={STORY_BG_URL}
          />
        )}
```

Also update the local `ApiResponse` interface in `PageClient.tsx` (the one declared near the top of the file, NOT the one in route.ts) to include `reward`:

```ts
interface ApiResponse {
  archetype: Archetype;
  badge: Badge;
  stats: CardStats;
  insight: string;
  serial: string;
  motivation: string;
  promocode: string;
  reward: Reward;
}
```

And add `Reward` to the type import at the top of the file:

```ts
import type { Archetype, Badge, CardStats, Reward } from "@/lib/archetypes";
```

- [ ] **Step 3.4: Verify the build is clean**

```bash
cd "/Users/nick/General/kp landing" && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`, no TypeScript errors.

- [ ] **Step 3.5: Smoke-test the story card visually**

Start the dev server and visit the deck preview to see archetype cards (the deck still uses the 16:9 `MovieCard` so this won't show the story card directly — but it confirms nothing is broken):

```bash
cd "/Users/nick/General/kp landing" && npm run dev > /tmp/kp-dev.log 2>&1 &
sleep 3
```

Open `http://localhost:3010` in a browser, submit any 8-digit number prefixed with `+374` (e.g. `+37411223344`), let the reveal complete, click `Save Story`. The (currently still off-screen) story card should now have the reward badge layout — open devtools and find the `MovieCardStory` element to inspect it.

Stop the dev server when done:
```bash
pkill -f "next dev" 2>/dev/null; true
```

- [ ] **Step 3.6: Commit**

```bash
cd "/Users/nick/General/kp landing" && git add src/components/MovieCardStory.tsx src/components/PageClient.tsx && git commit -m "$(cat <<'EOF'
Restructure MovieCardStory with reward badge block

Replaces the generic 'PROMO CODE' row with the approved reward-badge
voice: reward.flair italic above, big reward.label headline, archetype
'Exclusive' eyebrow, solid orange code pill (blurred until revealed),
utility row (Tap to copy / Valid 30 days).

PageClient now passes reward through to the off-screen render. Local
ApiResponse type updated to match the API contract.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Build the `RewardModal` component

**Files:**
- Create: `src/components/RewardModal.tsx`

This task creates the modal in isolation — it doesn't get wired into `PageClient` until Task 5. Build cleanliness is the only verification this task has.

- [ ] **Step 4.1: Create the file with full content**

Create `src/components/RewardModal.tsx` with this exact content:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { MovieCardStory } from "@/components/MovieCardStory";
import type { ApiResponse } from "@/app/api/generate/route";

interface Props {
  /** Controls visibility. Parent owns this state. */
  open: boolean;
  /** Called when the user dismisses the modal (×, Esc, backdrop click). */
  onClose: () => void;
  /** The full API response. Modal renders nothing if this is null. */
  data: ApiResponse | null;
  /** Reveal toggle state, mirrored from PageClient (URL ?reveal=1 sets default). */
  revealCode: boolean;
  /** Updater so the toggle works in both directions. */
  setRevealCode: (next: boolean) => void;
  /** Optional path under /public for the story card background. */
  bgImageUrl?: string;
}

/**
 * Modal that previews the 9:16 story card and downloads it as a 1080×1920
 * PNG. The card renders at fixed 1080 px width inside the modal; CSS
 * `transform: scale(...)` shrinks the visible preview to fit the viewport.
 * html-to-image captures the un-transformed inner DOM, so the downloaded
 * PNG is always crisp full-resolution regardless of viewport size.
 *
 * Why a modal: the previous off-screen render had no failure feedback —
 * if html-to-image hit a font / CORS / layout issue, the user just got
 * silence. With a visible modal, failures become observable, and the
 * "preview before save" UX matches what users expect.
 */
export function RewardModal({
  open,
  onClose,
  data,
  revealCode,
  setRevealCode,
  bgImageUrl,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const captureRef = useRef<HTMLDivElement>(null);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);

  // Portal mounting — only render in document.body after client mount,
  // so SSR doesn't try to access window/document.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Initial focus on Download button when modal opens
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => downloadBtnRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleDownload = useCallback(async () => {
    if (!captureRef.current || !data || saving) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        skipFonts: false,
        backgroundColor: data.archetype.bg,
      });
      const link = document.createElement("a");
      link.download = `kinopark-${data.archetype.id}-${data.serial}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Save Story failed:", e);
      setErrorMsg("Couldn't render — please try again");
    } finally {
      setSaving(false);
    }
  }, [data, saving]);

  const handleCopyCode = useCallback(async () => {
    if (!data || !revealCode) return;
    try {
      await navigator.clipboard.writeText(data.promocode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [data, revealCode]);

  if (!mounted || !data) return null;

  const node = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="reward-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Loyalty reward — preview and download"
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            // Click on backdrop (not on inner content) closes
            if (e.target === e.currentTarget) onClose();
          }}
          style={{
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "2rem 1rem",
          }}
        >
          <div
            className="relative flex flex-col items-center"
            style={{ gap: "1.4rem", maxWidth: "min(540px, 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="absolute"
              style={{
                top: "-3rem",
                right: 0,
                width: "2.4rem",
                height: "2.4rem",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "rgba(252,252,253,0.85)",
                fontSize: "1.1rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>

            {/* Scaled preview wrapper. The inner div renders at full 1080
                px width — html-to-image targets THAT div, so the PNG is
                always 1080×1920 regardless of how we scale here. */}
            <div
              style={{
                width: "min(486px, 90vw)",
                aspectRatio: "9 / 16",
                position: "relative",
                overflow: "hidden",
                borderRadius: "1.5rem",
                boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  width: "1080px",
                  transform: "scale(calc(min(486px, 90vw) / 1080))",
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
                onClick={handleCopyCode}
              >
                <div ref={captureRef} style={{ width: "1080px" }}>
                  <MovieCardStory
                    archetype={data.archetype}
                    badge={data.badge}
                    stats={data.stats}
                    insight={data.insight}
                    serial={data.serial}
                    promocode={data.promocode}
                    reward={data.reward}
                    revealCode={revealCode}
                    bgImageUrl={bgImageUrl}
                  />
                </div>
              </div>
            </div>

            {/* Controls row */}
            <div
              className="w-full flex items-center"
              style={{ gap: "0.8rem", justifyContent: "space-between" }}
            >
              <RevealSwitch
                on={revealCode}
                onChange={setRevealCode}
                copied={copied}
              />

              <button
                ref={downloadBtnRef}
                type="button"
                onClick={handleDownload}
                disabled={saving}
                className="kp-pill"
                style={{
                  flex: "0 1 auto",
                  padding: "0.85rem 1.6rem",
                  fontSize: "0.92rem",
                }}
              >
                {saving ? "Saving…" : "Download PNG"}
              </button>
            </div>

            {errorMsg && (
              <p
                className="text-center"
                style={{
                  fontSize: "0.85rem",
                  color: "rgba(255,180,160,0.95)",
                  marginTop: "-0.4rem",
                }}
              >
                {errorMsg}
              </p>
            )}

            <p
              style={{
                fontSize: "0.72rem",
                color: "rgba(252,252,253,0.45)",
                textAlign: "center",
                letterSpacing: "0.04em",
              }}
            >
              {data.reward.redemption}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}

function RevealSwitch({
  on,
  onChange,
  copied,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  copied: boolean;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: "0.65rem",
        padding: "0.45rem 0.85rem 0.45rem 0.95rem",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: "0.78rem",
          color: copied
            ? "#A8C53C"
            : on
              ? "#FCFCFD"
              : "rgba(252,252,253,0.6)",
          letterSpacing: "0.02em",
          transition: "color 200ms ease",
        }}
      >
        {copied ? "Copied ✓" : on ? "Code visible" : "Show code"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={on ? "Hide promo code" : "Show promo code"}
        onClick={() => onChange(!on)}
        style={{
          width: "2.2rem",
          height: "1.25rem",
          borderRadius: "999px",
          background: on ? "#CA4C16" : "rgba(255,255,255,0.16)",
          position: "relative",
          transition: "background 180ms ease",
          cursor: "pointer",
          flexShrink: 0,
          border: "none",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "2px",
            left: on ? "calc(100% - 1.05rem)" : "2px",
            width: "calc(1.25rem - 4px)",
            height: "calc(1.25rem - 4px)",
            borderRadius: "999px",
            background: "#FCFCFD",
            transition: "left 180ms ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}
```

- [ ] **Step 4.2: Verify the build is clean (component compiles standalone)**

```bash
cd "/Users/nick/General/kp landing" && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`. If TypeScript complains about `import type { ApiResponse } from "@/app/api/generate/route"` — verify that line in `route.ts` exports the type with `export type ApiResponse = …` (it does as of Task 2; if it's just `type` without `export`, fix that in route.ts too).

- [ ] **Step 4.3: Commit**

```bash
cd "/Users/nick/General/kp landing" && git add src/components/RewardModal.tsx && git commit -m "$(cat <<'EOF'
Add RewardModal — preview-and-download for the 9:16 story card

Renders the story card at fixed 1080px inside a centered modal,
visually scaled with CSS transform. html-to-image captures the
un-transformed inner DOM for a 1080x1920 PNG.

Modal handles: portal mount, body scroll lock, Esc / backdrop / x
to close, focus trap (initial focus on Download), reveal toggle,
copy-on-tap when revealed, and inline error if the render fails.

Component built in isolation; PageClient wiring lands in the next
commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Wire `RewardModal` into `PageClient`

**Files:**
- Modify: `src/components/PageClient.tsx`

- [ ] **Step 5.1: Import `RewardModal` and remove the off-screen story render**

At the top of `PageClient.tsx`, add the import next to the others:

```ts
import { RewardModal } from "@/components/RewardModal";
```

Then find the off-screen story render block — it starts with the comment `{/* ── Off-screen 9:16 story canvas` and ends with the closing `</div>` before `{/* Footer */}`. Delete that entire block.

Also delete the `storyRef` declaration:

```ts
  const storyRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 5.2: Add `modalOpen` state and replace `handleSaveStory` body**

Find the existing `const [savingStory, setSavingStory] = useState(false);` line. Replace it with:

```ts
  const [modalOpen, setModalOpen] = useState(false);
```

Then find the `handleSaveStory` callback (the whole `useCallback` block). Replace it with a simpler trigger:

```ts
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
```

- [ ] **Step 5.3: Update the Save Story button to open the modal**

Find the Save Story button in the result-stage block. Replace:

```tsx
                  <button
                    onClick={handleSaveStory}
                    disabled={savingStory}
                    className="kp-pill flex-1"
                    style={{
                      background: "rgba(255,255,255,0.10)",
                      boxShadow: "none",
                    }}
                  >
                    {savingStory ? "Saving…" : "Save Story"}
                  </button>
```

with:

```tsx
                  <button
                    onClick={openModal}
                    className="kp-pill flex-1"
                    style={{
                      background: "rgba(255,255,255,0.10)",
                      boxShadow: "none",
                    }}
                  >
                    Save Story
                  </button>
```

- [ ] **Step 5.4: Render `RewardModal` near the top of the JSX tree**

Find the line `</footer>` near the very bottom of the `return (...)` JSX. Insert the modal just BEFORE `</footer>`'s closing parent `</div>`:

```tsx
      <RewardModal
        open={modalOpen}
        onClose={closeModal}
        data={data}
        revealCode={revealCode}
        setRevealCode={setRevealCode}
        bgImageUrl={STORY_BG_URL}
      />
    </div>
  );
}
```

(That last `</div>` and `}` are the existing close of the outer wrapper and component — don't duplicate them; just add `<RewardModal ... />` immediately above the existing `</div>` that closes the page wrapper.)

- [ ] **Step 5.5: Verify the build is clean**

```bash
cd "/Users/nick/General/kp landing" && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`, no warnings about unused imports (`storyRef`, `savingStory`, `handleSaveStory` should all be gone).

- [ ] **Step 5.6: Smoke-test the full flow locally**

```bash
cd "/Users/nick/General/kp landing" && npm run dev > /tmp/kp-dev.log 2>&1 &
sleep 3
```

In a browser at `http://localhost:3010`:
1. Submit `+37411223344`
2. Wait for the reveal animation to finish
3. Click `Save Story` — modal should open with the 9:16 card visible, code blurred
4. Click `Show code` — code becomes visible, switch turns orange
5. Click on the visible code — toggle should briefly read `Copied ✓`
6. Click `Download PNG` — button shows `Saving…`, then a `kinopark-<archetype>-<serial>.png` file lands in your Downloads folder
7. Open the PNG — it should be 1080×1920, the full story card with reward badge, code visible (because `revealCode` is true)
8. Press Esc — modal closes
9. Click `Save Story` again, click outside the card — modal closes (backdrop click)

Stop the dev server:
```bash
pkill -f "next dev" 2>/dev/null; true
```

If the PNG download produced a corrupt or all-black file, see "Risks" in the spec — most likely cause is fonts not loading at capture time. The fix is to add a `document.fonts.ready` await before `toPng` in `RewardModal.handleDownload`. Example patch:

```ts
      if (document.fonts && "ready" in document.fonts) {
        await document.fonts.ready;
      }
      const dataUrl = await toPng(captureRef.current, { ... });
```

- [ ] **Step 5.7: Commit**

```bash
cd "/Users/nick/General/kp landing" && git add src/components/PageClient.tsx && git commit -m "$(cat <<'EOF'
Wire RewardModal into PageClient; remove off-screen render

Save Story button now opens a modal with the story card visible at
proper size. The modal owns the html-to-image render against an
un-transformed 1080px node, so the PNG is always 1080x1920.

The previous off-screen story render and savingStory state are gone.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Simplify the 16:9 `MovieCard` and add the loyalty hint

**Files:**
- Modify: `src/components/MovieCard.tsx`
- Modify: `src/components/PageClient.tsx`

- [ ] **Step 6.1: Remove `promocode` and `revealCode` from `MovieCard` props**

In `src/components/MovieCard.tsx`, replace the `Props` interface:

```ts
interface Props {
  archetype: Archetype;
  badge: Badge;
  stats: CardStats;
  insight: string;
  serial: string;
}
```

Update the function signature destructuring:

```tsx
export function MovieCard({ archetype, badge, stats, insight, serial }: Props) {
```

- [ ] **Step 6.2: Restore single-row footer; move stats and insight back to original positions**

Find the stats row block in `MovieCard.tsx`. The current `bottom: "14cqw"` was bumped to make room for the promo footer — revert it:

```tsx
      {/* ── Stats row ──────────────────────────────────────────────── */}
      <div
        className="absolute flex items-end"
        style={{
          left: "4cqw",
          right: "4cqw",
          bottom: "10.5cqw",
          gap: "6cqw",
        }}
      >
```

Find the insight callout block — bottom was `9.5cqw`, revert to `6cqw`:

```tsx
      {/* ── Insight callout ─────────────────────────────────────────── */}
      <div
        className="absolute flex items-center"
        style={{
          left: "4cqw",
          right: "4cqw",
          bottom: "6cqw",
          gap: "1.2cqw",
          fontSize: "1.7cqw",
          fontWeight: 500,
        }}
      >
```

Find the entire footer block — the one with `Promo Code` label, `withAlpha` border, and the serial/url row inside. Replace the whole `<div>` with the simple single-row footer:

```tsx
      {/* ── Footer: serial + url ────────────────────────────────────── */}
      <div
        className="absolute flex items-center justify-between"
        style={{
          left: "4cqw",
          right: "4cqw",
          bottom: "2.5cqw",
          fontSize: "1cqw",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          opacity: 0.45,
          fontWeight: 600,
        }}
      >
        <span>N° {serial} / 2026</span>
        <span>KINOPARK.AM</span>
      </div>
```

The `withAlpha` import is no longer needed by MovieCard if it isn't referenced elsewhere — verify by searching the file. If `withAlpha(...)` is still referenced (e.g., in the `radial-gradient` corner glow at the top), keep the import.

- [ ] **Step 6.3: Update `PageClient` to drop the now-removed props**

In `PageClient.tsx`, find the `<MovieCard>` render inside `<CardScene>`. Remove the `promocode` and `revealCode` props:

```tsx
            {data ? (
              <MovieCard
                archetype={data.archetype}
                badge={data.badge}
                stats={data.stats}
                insight={data.insight}
                serial={data.serial}
              />
            ) : (
              <div className="w-full h-full" />
            )}
```

- [ ] **Step 6.4: Add the "Loyalty perk inside ↓" hint above the buttons**

In `PageClient.tsx`, find the result-stage block. Insert a hint line ABOVE the buttons (between the `motivation` `<p>` and the `<div className="flex flex-col sm:flex-row gap-3 ...">` wrapper).

Replace this section:

```tsx
                {/* Show-code toggle. Default OFF — code is blurred so the
                    card screenshots safely. Marketing can hand out personal
                    links with ?reveal=1 to flip it on for specific users. */}
                <RevealToggle
                  on={revealCode}
                  onChange={setRevealCode}
                  code={data.promocode}
                />

                <div className="flex flex-col sm:flex-row gap-3 mt-5 w-full max-w-[560px]">
```

with:

```tsx
                <button
                  type="button"
                  onClick={openModal}
                  className="flex items-center"
                  style={{
                    marginTop: "1.4rem",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: "rgba(202,76,22,0.08)",
                    border: "1px solid rgba(202,76,22,0.25)",
                    borderRadius: "999px",
                    color: "rgba(255,200,170,0.92)",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    cursor: "pointer",
                    transition: "background 150ms ease, border-color 150ms ease",
                  }}
                  aria-label="Open loyalty reward preview"
                >
                  <span style={{ color: "#CA4C16" }}>✦</span>
                  <span>Your loyalty perk is inside</span>
                  <span style={{ opacity: 0.7 }}>↓</span>
                </button>

                <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-[560px]">
```

The two-button row (Share + Save Story + Read Again) underneath stays as-is from Task 5.

- [ ] **Step 6.5: Remove the unused `RevealToggle` component**

Search `PageClient.tsx` for `function RevealToggle`. The component is defined near the bottom of the file (between `function NavLink` and the file end). Since the toggle is gone (the modal owns it now), delete the whole `function RevealToggle({...}) { ... }` block.

The file should now end with just `function NavLink(...)`.

- [ ] **Step 6.6: Verify the build is clean**

```bash
cd "/Users/nick/General/kp landing" && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`. Watch for any lint warning about unused state — if `revealCode` and `setRevealCode` are still flagged, they're being used (passed to the modal), so warnings should be clean.

- [ ] **Step 6.7: Smoke-test**

```bash
cd "/Users/nick/General/kp landing" && npm run dev > /tmp/kp-dev.log 2>&1 &
sleep 3
```

At `http://localhost:3010`, submit a phone, see the reveal:
- 16:9 card has its old clean footer (just `N° XXXX / 2026 · KINOPARK.AM`) — no promo block
- Below the motivation copy: a small `✦ Your loyalty perk is inside ↓` pill
- Three action buttons: `Share My Card · Save Story · Read Again`
- Click the perk pill: modal opens
- Click `Save Story`: same modal opens
- Both paths produce identical modal behaviour

Stop the dev server:
```bash
pkill -f "next dev" 2>/dev/null; true
```

- [ ] **Step 6.8: Commit**

```bash
cd "/Users/nick/General/kp landing" && git add src/components/MovieCard.tsx src/components/PageClient.tsx && git commit -m "$(cat <<'EOF'
Simplify 16:9 reveal: drop promo row, add loyalty perk hint

The 16:9 card goes back to pure cinema-identity. Stats, insight,
footer all return to their original positions. The provisional
promo row + RevealToggle below the card are gone — the reward
lives in the modal.

Above the action buttons, a small accent pill teases what's
inside ('Your loyalty perk is inside ↓') and opens the same
modal as Save Story.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Clean up `deck/page.tsx`

**Files:**
- Modify: `src/app/deck/page.tsx`

The deck preview currently passes `promocode` and `revealCode` to `MovieCard`. After Task 6 those props are gone — without this fix, the deck page will fail TypeScript.

- [ ] **Step 7.1: Drop `buildPromocode` from imports and the promocode/revealCode props**

In `src/app/deck/page.tsx`, replace the import block:

```tsx
import Link from "next/link";
import {
  ARCHETYPES,
  BADGES,
  buildInsight,
  buildStats,
} from "@/lib/archetypes";
import { MovieCard } from "@/components/MovieCard";
import { KinoLogo } from "@/components/KinoLogo";
```

In the same file, find the inside of the `.map()` over archetypes. Delete the `const promocode = buildPromocode(seed, a);` line. Then update the `<MovieCard>` JSX:

```tsx
                <MovieCard
                  archetype={a}
                  badge={badge}
                  stats={stats}
                  insight={insight}
                  serial={serial}
                />
```

- [ ] **Step 7.2: Verify the build**

```bash
cd "/Users/nick/General/kp landing" && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`. Visiting `http://localhost:3010/deck` should still show all 10 archetype cards in a grid.

- [ ] **Step 7.3: Commit**

```bash
cd "/Users/nick/General/kp landing" && git add src/app/deck/page.tsx && git commit -m "$(cat <<'EOF'
Drop promocode props from deck preview cards

MovieCard no longer takes promocode/revealCode (those moved to the
modal-only story card). The deck preview just renders the clean
16:9 reveal.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Final verification + push

**Files:** none

- [ ] **Step 8.1: Full build and a clean output**

```bash
cd "/Users/nick/General/kp landing" && npm run build 2>&1 | tail -25
```

Expected: `✓ Compiled successfully in <Xms>`, all 5 routes listed, zero TypeScript errors.

- [ ] **Step 8.2: End-to-end smoke test**

```bash
cd "/Users/nick/General/kp landing" && npm run dev > /tmp/kp-dev.log 2>&1 &
sleep 3
```

At `http://localhost:3010`:

1. Submit `+37411223344` (any 8-digit) — reveal animation plays, 16:9 card lands clean (no promo block)
2. Below it: motivation copy → loyalty perk pill → Share/Save Story/Read Again
3. Click the perk pill OR Save Story — modal opens with the 9:16 story card visible
4. The story card shows the reward badge: flair italic line, big reward label with ✦, archetype "Exclusive" eyebrow, orange code pill (blurred), Tap-to-copy / Valid 30 days row
5. Toggle `Show code` — code becomes visible; toggle pill turns orange
6. Click on the visible code (anywhere on the card) — switch text reads `Copied ✓` for 2s
7. Click `Download PNG` — `kinopark-<archetype>-<serial>.png` lands in Downloads, 1080×1920, fully rendered
8. Esc closes the modal
9. Click Read Again — back to the landing page

Then test marketing URL params:

10. Visit `http://localhost:3010/?reward=double-points&promo=BIRTHDAY26&reveal=1`
11. Submit any phone — reveal plays, modal-friendly state propagates
12. Open modal — code shows `BIRTHDAY26` (uppercased), reward label says "Double Loyalty Points", and `Show code` toggle starts ON

Stop the dev server:
```bash
pkill -f "next dev" 2>/dev/null; true
```

If any step fails, fix it and re-commit before pushing.

- [ ] **Step 8.3: Push to origin**

```bash
cd "/Users/nick/General/kp landing" && git push origin main
```

If Vercel is connected to the repo, this triggers an automatic deploy. The deploy URL (e.g., `kinopark-cinema-identity.vercel.app`) updates within ~60 seconds.

---

## Out of scope for this plan (intentional)

- Background image asset (`/public/story-bg.jpg`) — pending from the user. Drop it in when ready and the modal picks it up automatically.
- Real loyalty system integration — codes don't redeem against anything yet. When the loyalty API ships, swap `pickReward` and `buildPromocode` for service calls; the response shape stays.
- Armenian localization on the reward block — English-only for v1, matches the rest of the card.
- Analytics on modal open / download click — not yet.
- Per-reward expiry logic — `Valid 30 days` is fixed copy.

## After execution

When all 8 tasks are complete, the user can:
- Drop a background image into `/public/story-bg.jpg` (no code change needed) and the story card picks it up
- Send marketing links like `kinopark.am/?phone=+374...&reward=premium-upgrade&promo=KPVIP&reveal=1` to specific users for personal redemption
- Continue with the deferred work (real loyalty API, Armenian copy, analytics) in subsequent plans
