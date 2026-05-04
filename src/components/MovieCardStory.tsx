"use client";

import type { Archetype, Badge, CardStats, Reward } from "@/lib/archetypes";
import { KinoLogo } from "@/components/KinoLogo";

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

/**
 * 9:16 Instagram-Story format of the cinema-identity card.
 *
 * Same data as MovieCard, vertical layout, more breathing room. Designed to
 * be captured to PNG via `html-to-image` and downloaded by the user as a
 * shareable Story asset. All sizing in container query units (cqw), so the
 * same component renders crisp at any container size.
 */
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
  const { title, genre, bg, ink, accent } = archetype;

  // Title scaling — 9:16 is narrow; titles need to wrap-friendly sizing.
  const titleLen = Math.max(title.length, 1);
  const titleSize = `${Math.max(8, Math.min(13, 140 / titleLen))}cqw`;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        aspectRatio: "9 / 16",
        background: bg,
        color: ink,
        containerType: "inline-size",
        fontFamily: "var(--font-body), system-ui, sans-serif",
        borderRadius: "3cqw",
      }}
    >
      {/* Background image layer (optional) */}
      {bgImageUrl && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {/* Tinting overlay — keeps text readable over any bg image and ties
          the card to the per-archetype palette. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: bgImageUrl
            ? `linear-gradient(180deg, ${withAlpha(bg, 0.55)} 0%, ${withAlpha(bg, 0.3)} 35%, ${withAlpha(bg, 0.85)} 100%)`
            : "transparent",
        }}
      />

      {/* Atmospheric corner glows (above tint, below content) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 40% at 0% 100%, ${withAlpha(accent, 0.22)} 0%, transparent 60%), radial-gradient(ellipse 70% 40% at 100% 0%, ${withAlpha(accent, 0.12)} 0%, transparent 60%)`,
        }}
      />

      {/* Faint grain */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-25"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 320 320' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Content stack ───────────────────────────────────────────── */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{ padding: "7cqw 6cqw 6cqw 6cqw" }}
      >
        {/* Top strip: KP logo + behaviour badge */}
        <div className="flex items-center justify-between">
          <span style={{ height: "5cqw", display: "inline-flex" }}>
            <KinoLogo />
          </span>
          <BadgePill label={badge.label} />
        </div>

        {/* Eyebrow + title */}
        <div style={{ marginTop: "12cqw" }}>
          <div
            style={{
              color: accent,
              fontSize: "2.4cqw",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Cinema Identity
          </div>
          <h2
            className="kp-display"
            style={{
              fontSize: titleSize,
              color: ink,
              fontWeight: 800,
              margin: 0,
              marginTop: "2cqw",
              lineHeight: 0.95,
            }}
          >
            {title}
          </h2>
          <div
            style={{
              marginTop: "2cqw",
              color: accent,
              fontSize: "2.6cqw",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {genre}
          </div>
        </div>

        {/* Stats — three columns, big numbers */}
        <div
          className="flex items-end"
          style={{ marginTop: "auto", gap: "5cqw" }}
        >
          <Stat value={String(stats.moviesWatched)} label="Movies" accent={accent} ink={ink} />
          <Stat value={`${stats.premiumPct}%`} label="Premium" accent={accent} ink={ink} />
          <Stat value={`${stats.topGenrePct}%`} label={genre} accent={accent} ink={ink} />
        </div>

        {/* Insight callout */}
        <div
          className="flex items-start"
          style={{
            marginTop: "5cqw",
            gap: "2cqw",
            fontSize: "3.2cqw",
            fontWeight: 500,
            lineHeight: 1.3,
          }}
        >
          <span
            style={{
              color: accent,
              fontSize: "3.6cqw",
              fontWeight: 800,
              lineHeight: 1,
              flexShrink: 0,
              marginTop: "0.2cqw",
            }}
          >
            ✦
          </span>
          <span style={{ color: ink, opacity: 0.92 }}>{insight}</span>
        </div>

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

          <div style={{ marginTop: "3.5cqw" }}>
            <span
              className="kp-display"
              style={{
                color: "#CA4C16",
                fontSize: "6cqw",
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

        {/* Footer: serial + url */}
        <div
          className="flex items-center justify-between"
          style={{
            marginTop: "5cqw",
            fontSize: "1.8cqw",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            opacity: 0.5,
            fontWeight: 600,
          }}
        >
          <span>N° {serial} / 2026</span>
          <span>KINOPARK.AM</span>
        </div>
      </div>
    </div>
  );
}

/* ── Building blocks ────────────────────────────────────────────────── */

function Stat({
  value,
  label,
  accent,
  ink,
}: {
  value: string;
  label: string;
  accent: string;
  ink: string;
}) {
  return (
    <div className="flex flex-col" style={{ gap: "0.8cqw", flex: 1, minWidth: 0 }}>
      <span
        className="kp-display"
        style={{
          color: ink,
          fontSize: "8.5cqw",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          fontFeatureSettings: "'tnum'",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          color: accent,
          fontSize: "1.9cqw",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function BadgePill({ label }: { label: string }) {
  return (
    <span
      className="flex items-center"
      style={{
        gap: "1cqw",
        padding: "1.4cqw 2.6cqw",
        background: "#CA4C16",
        color: "#FCFCFD",
        borderRadius: "20cqw",
        fontSize: "2.2cqw",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "var(--font-display), sans-serif",
        boxShadow: "0 0 6cqw rgba(202,76,22,0.45)",
      }}
    >
      <span style={{ fontSize: "1.7cqw", color: "#FFD23D" }}>◆</span>
      <span>{label}</span>
    </span>
  );
}

/* ── Colour helpers ─────────────────────────────────────────────────── */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
