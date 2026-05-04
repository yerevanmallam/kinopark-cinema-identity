# Story Modal + Loyalty Rewards — Design

Date: 2026-05-04
Status: Approved (brainstorming session)

## Why this exists

Two problems landed on the v2 card together:

1. **Save Story is broken.** `html-to-image` runs against an off-screen `<div>` that the user never sees. When it fails (cross-origin font, container query quirks, layout race), there's no visible failure mode — the user just doesn't get a download. Users explicitly want to **see the full card** before saving.

2. **The promocode UX is too thin.** A blurred string above the serial line doesn't say what the code unlocks. KinoPark wants this surface to lean into loyalty rewards — different perks (free popcorn, premium upgrade, BOGO ticket, etc.) tied to who the user is, with marketing able to override for targeted campaigns.

This spec resolves both at once: rewards become first-class data, and the story card moves into a modal that doubles as the PNG-render stage.

## Decisions (all locked)

| # | Decision | Rationale |
|---|---|---|
| 1 | "Save Story" opens a **modal preview** containing the full 9:16 card | Clean reveal page; the visible modal *is* the html-to-image render target — failures become visible to the user |
| 2 | **Hybrid reward model** — each archetype has a default reward; URL `?reward=ID` overrides | Personal feel out of the box; full marketing control on send-outs |
| 3 | **Reward badge voice** — `FREE POPCORN ✦` headline, `DRAMA QUEEN EXCLUSIVE` eyebrow, solid orange code pill, utility row | Punchy, marketing-forward, fits a shareable promo asset |
| 4 | Drop the promocode row from the **16:9 reveal card**; replace with a small "Loyalty perk inside ↓" hint that opens the modal | Keep reveal pure (cinema identity); deliver reward in the modal |

## Data model

In `src/lib/archetypes.ts`:

```ts
export type Reward = {
  id: string;          // "free-popcorn", "premium-upgrade", …
  label: string;       // "Free Large Popcorn"
  flair: string;       // "Large salted, every screening." — fits under the label
  redemption: string;  // "Show this code at the box office" — under the code pill
};

export const REWARDS: Reward[] = [ … ];   // 9 entries (7 base + 2 marketing-only)
```

Each `Archetype` gains a `defaultRewardId: string` field. New helper:

```ts
export function pickReward(seed: string, archetype: Archetype, override?: string): Reward
```

- If `override` matches a `REWARDS` id, return it (case-insensitive, sanitized).
- Otherwise return the archetype's default reward.

### Reward → archetype mapping

| Archetype | Default reward |
|---|---|
| Cinephile | Premium recliner upgrade |
| Anime Devotee | Free combo (popcorn + drink) |
| Drama Queen | Free large popcorn |
| Horror Junkie | Free late-show ticket |
| Sci-Fi Nerd | Premium recliner upgrade |
| Action Hero | Buy-one-get-one weekday ticket |
| Sleuth | Free drink |
| Hopeless Romantic | Date Night (2 tickets) |
| Comedy Captain | Free large popcorn |
| Indie Soul | Buy-one-get-one weekday ticket |

Marketing-only (URL `?reward=`):
- `double-points` — Double loyalty points for 30 days
- `twenty-off-any` — 20% off any ticket

### API contract change

`/api/generate` adds:
- New URL param: `?reward=<reward-id>` — sanitized, case-insensitive, ignored if not in pool
- New field in response: `reward: Reward`

`ApiResponse` becomes:
```ts
{ archetype, badge, stats, insight, serial, motivation, promocode, reward }
```

Existing fields and behaviour are unchanged.

## Reward block (on the 9:16 story card)

Layout (top to bottom of the block, sized in `cqw`):

```
[ reward.flair — muted, italic, ≈2.6cqw ]
FREE POPCORN ✦                           ← reward.label, Inter 800, ≈9cqw, ✦ in accent
DRAMA QUEEN EXCLUSIVE                    ← `${archetype.title} Exclusive`, accent, ≈2.4cqw
[  KP-DRMA-7Q4P  ]                       ← solid orange pill, white code, blurred when revealCode=false
TAP TO COPY · VALID 30 DAYS              ← muted utility row
```

Position: where the current `Promo Code` block lives, with more vertical space (currently ~13cqw — bumping to ~26cqw of vertical real estate to give the reward room to breathe).

Blur behavior: `filter: blur(11px)` on the code pill text when `revealCode` is false.

Tap-to-copy: when `revealCode` is true, clicking the code pill copies it to clipboard via `navigator.clipboard.writeText` and the utility row swaps to `Copied ✓` for 2 seconds. While `revealCode` is false, the pill is non-interactive and the utility row label still reads "Tap to copy" (as a hint of what unlocks).

Component file: `MovieCardStory.tsx` (existing, restructured).

## Modal flow

New component: `src/components/RewardModal.tsx`.

```
Trigger: <button>Save Story</button>  (always visible on the result stage)
                ↓
            <RewardModal>
              ├─ dark backdrop (rgba(0,0,0,0.85), backdrop-filter: blur(8px))
              ├─ centered card slot at fixed 1080×1920px, scaled with CSS
              │   transform to fit the viewport (target: 80vh max)
              ├─ inside the card: <MovieCardStory> with the live data
              ├─ controls below the card:
              │   [○ Show code]  [Download PNG]
              ├─ close: × button, Esc key, backdrop click
              └─ aria-modal, focus trap (initial focus on Download)
```

Implementation notes:
- Modal is **portaled to `document.body`** to avoid stacking-context issues with the existing reveal flash overlay
- `transform: scale(N)` is applied to a wrapper around the card; the inner card stays at 1080px so html-to-image captures crisp full-resolution output
- The `revealCode` toggle is shared state with the page-level URL param `?reveal=1`. Toggle reflects current state and updates it.

### PNG capture

```ts
async function downloadPng() {
  const node = innerCardRef.current;        // un-transformed 1080×1920 div
  const dataUrl = await htmlToImage.toPng(node, {
    cacheBust: true,
    pixelRatio: 1,                          // already retina at 1080
    skipFonts: false,
    backgroundColor: archetype.bg,
  });
  const a = document.createElement("a");
  a.download = `kinopark-${archetype.id}-${serial}.png`;
  a.href = dataUrl;
  a.click();
}
```

Why this works where the off-screen render didn't:
- Capture target is a **visible, mounted DOM node** with real layout — fonts have loaded, container queries have resolved, background image (if present) has decoded
- Failure modes (font load timeout, CORS) become observable to the user instead of silently producing nothing
- The user reads the modal as a "preview before save," which is what they asked for

### Loading + error states

- **Loading:** Download button shows `Saving…` and disables while `toPng` is in flight
- **Error:** Inline copy under the button: `Couldn't render — try again` + a retry. Errors logged to `console.error` for now (no external monitoring yet)
- **Slow network:** background image (if any) is preloaded by the modal on open; download stays disabled until images decode

## 16:9 reveal card

`MovieCard.tsx` reverts the recently-added promo row. Footer goes back to a single line:

```
N° 4521 / 2026                              KINOPARK.AM
```

Above that footer, a new tiny pill button:

```
↓ Loyalty perk inside
```

- Subtle styling: small caps, muted ink, accent on hover
- Click opens the same `<RewardModal>`
- Visible only on the result stage (not during reveal animation)

This keeps the reveal page focused on cinema identity and lets the reward live where it gets the room it deserves.

## URL parameters (marketing levers)

| Param | Layered effect |
|---|---|
| `?phone=` | Required — picks all per-user data |
| `?archetype=` | Forces an archetype (existing) |
| `?badge=` | Forces a badge (existing) |
| `?promo=` | Forces a specific promocode (existing) |
| `?reward=` | **NEW** — forces a specific reward type from `REWARDS` |
| `?reveal=1` | Modal opens with code already revealed (existing) |

Validation:
- `?reward=` is case-insensitive, sanitized to `[a-z0-9-]`, ignored if not in pool
- All other params unchanged

Combined example for a personal send-out:
```
kinopark.am/?phone=+374XXXXXXXX&reward=double-points&promo=BIRTHDAY26&reveal=1
```

## Files touched

| File | Change |
|---|---|
| `src/lib/archetypes.ts` | + `Reward` type, `REWARDS` pool, `defaultRewardId` per archetype, `pickReward` helper |
| `src/app/api/generate/route.ts` | + `?reward=` param, return `reward` in response |
| `src/components/MovieCardStory.tsx` | Replace generic promo block with reward badge layout (Option B) |
| `src/components/MovieCard.tsx` | Remove provisional promo row; add "Loyalty perk inside ↓" hint pill |
| `src/components/RewardModal.tsx` | **NEW** — modal preview + Download PNG + show-code toggle |
| `src/components/PageClient.tsx` | Replace inline toggle/Save Story handler with modal trigger; remove off-screen story render; update local `ApiResponse` type |
| `src/app/deck/page.tsx` | Pass `reward` to deck preview cards (revealed) |
| `public/story-bg.jpg` | Drop user-provided image when ready (no code change needed — already wired) |

## Out of scope (intentional)

- Real loyalty system integration — the codes don't redeem against anything yet. When Loyalty API ships, swap `pickReward` and `buildPromocode` with calls to it; response shape stays.
- Localization (Armenian copy on the reward block) — currently English-only, matching the rest of the card
- Per-reward expiry logic — `Valid 30 days` is fixed copy for v1
- Analytics — no tracking on modal open / download click yet

## Open questions for the build

- **Background image:** still pending from the user. Until it lands, `/story-bg.jpg` 404s silently and the per-archetype color shows. No regression.
- **Vercel deploy:** unknown if the previous deploy completed. Either way, push triggers a new build on merge.

## Risks

- **html-to-image cross-origin font issue.** Inter and Poppins ship via `next/font`, which inlines them as same-origin. Should be fine; if not, we can preload the fonts as data-URIs in the modal mount effect.
- **Modal scaling math.** Need to clamp `scale(N)` so the card fits inside `max-height: 80vh` on tall, narrow viewports (mobile portrait). Worst case: scrollable modal interior.
- **Reward duplication across archetypes.** Drama Queen and Comedy Captain both default to "Free Large Popcorn". Acceptable — the eyebrow says "Drama Queen Exclusive" vs "Comedy Captain Exclusive", so the framing differs even if the perk is the same.
