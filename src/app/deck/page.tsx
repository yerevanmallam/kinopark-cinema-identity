import Link from "next/link";
import {
  ARCHETYPES,
  BADGES,
  buildInsight,
  buildPromocode,
  buildStats,
  pickReward,
} from "@/lib/archetypes";
import { MovieCard } from "@/components/MovieCard";
import { KinoLogo } from "@/components/KinoLogo";

export default function DeckPage() {
  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#FCFCFD" }}>
      {/* Atmospheric corner glow — same as landing */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          left: 0,
          bottom: 0,
          width: "60vw",
          height: "70vh",
          background:
            "radial-gradient(ellipse 70% 70% at 0% 100%, rgba(115,160,80,0.18) 0%, transparent 65%)",
        }}
      />

      {/* Floating pill nav matching landing */}
      <header
        className="relative z-30 mx-auto"
        style={{ width: "min(95%, 920px)", marginTop: "1.25rem" }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            background: "rgba(20, 20, 20, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "999px",
            padding: "0.5rem 0.5rem 0.5rem 1.4rem",
          }}
        >
          <Link href="/" className="flex items-center">
            <KinoLogo height={26} />
          </Link>

          <Link
            href="/"
            className="kp-pill-ghost"
            style={{ padding: "0.55rem 1.2rem", fontSize: "0.85rem" }}
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="relative z-10 px-6 sm:px-12 pb-20">
        <div className="text-center" style={{ paddingBlock: "3.5rem 2.5rem" }}>
          <span
            className="kp-pill"
            style={{
              fontSize: "0.78rem",
              padding: "0.4rem 1rem",
              boxShadow: "0 0 36px rgba(202,76,22,0.30)",
            }}
          >
            The Full Deck
          </span>
          <h1
            className="kp-display"
            style={{
              fontSize: "clamp(2.4rem, 5.6vw, 4.4rem)",
              fontWeight: 800,
              marginTop: "1.4rem",
            }}
          >
            Ten cinema-goers.
            <br />
            <span style={{ color: "#CA4C16" }}>One of them is you.</span>
          </h1>
        </div>

        <div
          className="mx-auto grid gap-8"
          style={{
            maxWidth: "1240px",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          }}
        >
          {ARCHETYPES.map((a, i) => {
            // Cycle through badges so neighbouring cards don't share one,
            // and seed the stats/insight per (archetype × badge) combo so
            // the preview cards always show realistic data.
            const badge = BADGES[i % BADGES.length];
            const seed = `${a.id}:${badge.id}:preview`;
            const stats = buildStats(seed, a);
            const insight = buildInsight(seed, a, stats);
            const promocode = buildPromocode(seed, a);
            const reward = pickReward(a);
            const serial = (1000 + i * 137).toString();
            return (
              <div key={a.id} className="flex flex-col" style={{ gap: "0.85rem" }}>
                <div className="flex items-center" style={{ gap: "0.6rem" }}>
                  <span
                    style={{ fontSize: "0.85rem", color: "#A8C53C", fontWeight: 600 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "rgba(252,252,253,0.45)" }}>
                    {a.genre}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(252,252,253,0.3)" }}>
                    · {badge.label}
                  </span>
                </div>
                <MovieCard
                  archetype={a}
                  badge={badge}
                  stats={stats}
                  insight={insight}
                  serial={serial}
                  promocode={promocode}
                  reward={reward}
                  revealCode
                />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
