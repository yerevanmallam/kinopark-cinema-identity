"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // still used for the reveal flash overlay
import { PhoneInput } from "@/components/PhoneInput";
import { MovieCard } from "@/components/MovieCard";
import { MovieCardStory } from "@/components/MovieCardStory";
import { CardBack } from "@/components/CardBack";
import { CardScene } from "@/components/CardScene";
import { KinoLogo } from "@/components/KinoLogo";
import type { Archetype, Badge, CardStats, Reward } from "@/lib/archetypes";

type CardFormat = "horizontal" | "story";

/** Background image used by the 9:16 story card. Default is a hand-built
 * SVG at /public/story-bg.svg (vector, scales crisp, no raster bloat). To
 * swap for a photo, drop a JPG/PNG into /public and update this path. */
const STORY_BG_URL = "/story-bg.svg";

type Stage = "landing" | "loading" | "revealing" | "result" | "error";

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

const ANALYSIS_STEPS = [
  "Pulling your watch history",
  "Counting your rewatches",
  "Cross-referencing genres",
  "Reading the patterns",
  "Matching an archetype",
  "Printing your card",
];

const STEP_DURATION = 750;

export function PageClient() {
  // Mount flag — framer-motion's initial styles produce SSR/CSR mismatches
  // (different opacity formatting), and the resulting hydration error breaks
  // event handlers. Rendering nothing on the server side and letting the
  // client take over after mount sidesteps the issue cleanly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [stage, setStage] = useState<Stage>("landing");
  const [phone, setPhone] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);

  const [showFlash, setShowFlash] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [savingCard, setSavingCard] = useState(false);
  const [format, setFormat] = useState<CardFormat>("horizontal");

  const apiPromiseRef = useRef<Promise<ApiResponse> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const revealTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stepTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Refs to the rendered card DOM nodes — used as html-to-image capture
  // targets when the user clicks Save Card. We need both refs so the
  // 9:16 capture works even when the visible card is the 16:9 one (and
  // vice-versa), without forcing a remount.
  const horizontalCardRef = useRef<HTMLDivElement>(null);
  const storyCardRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const archetypeOverride = searchParams.get("archetype");
  const badgeOverride = searchParams.get("badge");
  const promoOverride = searchParams.get("promo");

  // ?reveal=1 → marketing-link mode, code visible by default. Otherwise
  // the code is blurred until the user toggles it on.
  const [revealCode, setRevealCode] = useState(
    () => searchParams.get("reveal") === "1",
  );

  useEffect(() => {
    return () => {
      revealTimeouts.current.forEach(clearTimeout);
      stepTimeouts.current.forEach(clearTimeout);
      abortRef.current?.abort();
    };
  }, []);

  function handleSubmit(p: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhone(p);
    setError("");
    setStepIndex(0);
    setIsFlipped(false);
    setIsCharging(true);
    setCopyState("idle");

    const qs = new URLSearchParams({ phone: p });
    if (archetypeOverride) qs.set("archetype", archetypeOverride);
    if (badgeOverride) qs.set("badge", badgeOverride);
    if (promoOverride) qs.set("promo", promoOverride);
    apiPromiseRef.current = fetch(`/api/generate?${qs.toString()}`, {
      signal: controller.signal,
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not read your card");
      return json as ApiResponse;
    });

    setStage("loading");
  }

  const triggerReveal = useCallback((next: ApiResponse) => {
    setData(next);
    setStage("revealing");
    setIsCharging(false);

    revealTimeouts.current.forEach(clearTimeout);
    revealTimeouts.current = [
      setTimeout(() => setShowFlash(true), 0),
      setTimeout(() => setIsFlipped(true), 200),
      setTimeout(() => setShaking(true), 500),
      setTimeout(() => setShaking(false), 750),
      setTimeout(() => setShowFlash(false), 800),
      setTimeout(() => setStage("result"), 1400),
    ];
  }, []);

  function handleReset() {
    abortRef.current?.abort();
    revealTimeouts.current.forEach(clearTimeout);
    stepTimeouts.current.forEach(clearTimeout);
    setStage("landing");
    setPhone("");
    setData(null);
    setError("");
    setCopyState("idle");
    setIsFlipped(false);
    setIsCharging(false);
    setShaking(false);
    setShowFlash(false);
  }

  useEffect(() => {
    if (stage !== "loading") return;

    let cancelled = false;
    let current = 0;
    stepTimeouts.current = [];

    const advance = () => {
      if (cancelled) return;
      setStepIndex(Math.min(current, ANALYSIS_STEPS.length - 1));

      if (current >= ANALYSIS_STEPS.length) {
        resolveApi();
        return;
      }

      const id = setTimeout(() => {
        if (!cancelled) {
          current++;
          advance();
        }
      }, STEP_DURATION);
      stepTimeouts.current.push(id);
    };

    async function resolveApi() {
      if (!apiPromiseRef.current || cancelled) return;
      try {
        const result = await apiPromiseRef.current;
        if (cancelled) return;
        triggerReveal(result);
      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setIsCharging(false);
        setError(e instanceof Error ? e.message : "Something went wrong");
        setStage("error");
      } finally {
        apiPromiseRef.current = null;
      }
    }

    advance();
    return () => {
      cancelled = true;
      stepTimeouts.current.forEach(clearTimeout);
    };
  }, [stage, triggerReveal]);

  // Save the *visible* card as a PNG. The capture target is the un-scaled
  // card DOM node sitting inside CardScene; html-to-image inlines fonts and
  // serialises the SVG bg, so the output matches what the user sees.
  const handleSaveCard = useCallback(async () => {
    if (!data || savingCard) return;
    const node =
      format === "story" ? storyCardRef.current : horizontalCardRef.current;
    if (!node) return;
    setSavingCard(true);
    try {
      // Wait for fonts so html-to-image doesn't capture FOUT/empty glyphs.
      if (typeof document !== "undefined" && "fonts" in document && document.fonts) {
        await document.fonts.ready;
      }
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: false,
        backgroundColor: data.archetype.bg,
      });
      const link = document.createElement("a");
      link.download = `kinopark-${data.archetype.id}-${data.serial}-${format}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Save Card failed:", e);
    } finally {
      setSavingCard(false);
    }
  }, [data, format, savingCard]);

  // Copy the promocode (the code is the redeemable thing). Falls back
  // silently if clipboard API is blocked.
  const handleCopyCode = useCallback(async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.promocode);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      /* ignore — clipboard rejected */
    }
  }, [data]);

  // Server-side render = empty dark backdrop. Client takes over after mount.
  if (!mounted) {
    return (
      <div
        className="min-h-screen flex flex-col relative"
        style={{ background: "#0A0A0A", overflowX: "hidden" }}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: "#0A0A0A", overflowX: "hidden" }}
    >
      {/* Atmospheric corner glows — exactly like kinopark.am hero */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          left: 0,
          bottom: 0,
          width: "60vw",
          height: "70vh",
          background:
            "radial-gradient(ellipse 70% 70% at 0% 100%, rgba(26,90,86,0.40) 0%, transparent 65%)",
        }}
      />
      <div
        className="fixed pointer-events-none z-0"
        style={{
          right: 0,
          top: 0,
          width: "50vw",
          height: "60vh",
          background:
            "radial-gradient(ellipse 60% 70% at 100% 0%, rgba(202,76,22,0.10) 0%, transparent 60%)",
        }}
      />

      {/* Reveal flash — orange in KP brand */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, times: [0, 0.15, 0.4, 1], ease: "easeOut" }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 42%, rgba(202,76,22,0.55) 0%, rgba(202,76,22,0.18) 40%, transparent 70%)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating pill nav — matches kinopark.am exactly ─────────── */}
      <header
        className="relative z-30 mx-auto"
        style={{
          width: "min(95%, 920px)",
          marginTop: "1.25rem",
        }}
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
          {/* Logo — real KinoPark logo (three trees + wordmark) */}
          <a
            href="https://kinopark.am"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <KinoLogo height={26} />
          </a>

          {/* Nav links — center */}
          <nav className="hidden md:flex items-center" style={{ gap: "1.5rem" }}>
            <NavLink href="https://kinopark.am" label="Movies" />
            <NavLink href="https://kinopark.am" label="Gift Card" />
            <NavLink href="https://kinopark.am" label="Blog & Events" />
          </nav>

          {/* CTA */}
          <a
            href="https://kinopark.am"
            target="_blank"
            rel="noopener noreferrer"
            className="kp-pill"
            style={{ padding: "0.55rem 1.2rem", fontSize: "0.85rem", boxShadow: "none" }}
          >
            Buy Tickets
          </a>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main
        className={`relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-8 ${
          shaking ? "screen-shake" : ""
        }`}
      >
        <div className="relative w-full flex flex-col items-center" style={{ gap: "1.6rem" }}>
          {/* Hero — only visible on landing. Plain div (no framer-motion)
              to keep this region SSR-safe; the hydration mismatch from
              motion's initial styles breaks event handlers downstream. */}
          {stage === "landing" && (
            <div
              className="text-center"
              style={{
                transition: "opacity 250ms ease",
                opacity: stage === "landing" ? 1 : 0,
              }}
            >
                {/* Orange chip — matches "+ Buy Tickets" pill on kinopark.am */}
                <a
                  className="kp-pill"
                  href="#phone"
                  style={{
                    fontSize: "0.78rem",
                    padding: "0.5rem 1.1rem",
                    fontWeight: 500,
                    boxShadow: "0 0 36px rgba(202,76,22,0.30)",
                  }}
                >
                  <span style={{ fontSize: "1.1em", lineHeight: 1 }}>+</span>
                  <span>Cinema Identity</span>
                </a>

                <h1
                  className="kp-display"
                  style={{
                    fontSize: "clamp(2.4rem, 6vw, 4.6rem)",
                    color: "#FCFCFD",
                    marginTop: "1.4rem",
                    fontWeight: 800,
                  }}
                >
                  Find your<br />
                  cinema character
                </h1>

                <p
                  className="mx-auto"
                  style={{
                    maxWidth: "30rem",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    color: "rgba(252,252,253,0.6)",
                    marginTop: "1rem",
                  }}
                >
                  Drop your KinoPark phone number. We&rsquo;ll read your watch
                  history and match you to one of ten cinema-character cards.
                </p>
            </div>
          )}

          {/* Format tabs — only meaningful once the user has a card. Hidden
              during landing/loading/revealing so the reveal flow stays
              focused on the moment. */}
          {stage === "result" && data && (
            <FormatTabs format={format} onChange={setFormat} />
          )}

          <CardScene
            flipped={isFlipped}
            charging={isCharging}
            interactive={stage === "result"}
            floating={stage === "landing"}
            format={format}
            glowColor={data?.archetype.accent ?? "#CA4C16"}
          >
            <CardBack />
            {data ? (
              format === "story" ? (
                <div ref={storyCardRef} className="w-full h-full">
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
                </div>
              ) : (
                <div ref={horizontalCardRef} className="w-full h-full">
                  <MovieCard
                    archetype={data.archetype}
                    badge={data.badge}
                    stats={data.stats}
                    insight={data.insight}
                    serial={data.serial}
                    promocode={data.promocode}
                    reward={data.reward}
                    revealCode={revealCode}
                  />
                </div>
              )
            ) : (
              <div className="w-full h-full" />
            )}
          </CardScene>

          {/* Below-card area — plain conditional render. AnimatePresence
              caused intermittent stage-transition lockups in this branch
              (likely an interaction with `mode="wait"` and HMR). CSS-only
              transitions on opacity are enough; the card-flip animation is
              still framer-motion via CardScene. */}
          <div className="w-full" id="phone">
            {stage === "landing" && (
              <div className="w-full flex flex-col items-center fade-in">
                <PhoneInput onSubmit={handleSubmit} loading={false} />
                <div
                  className="mt-5 flex items-center"
                  style={{
                    gap: "0.8rem",
                    fontSize: "0.78rem",
                    color: "rgba(252,252,253,0.4)",
                    fontWeight: 400,
                  }}
                >
                  <span style={{ color: "#A8C53C" }}>●</span>
                  <span>10 cinema archetypes</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <a
                    href="/deck"
                    className="hover:text-[#FCFCFD] transition-colors"
                    style={{ color: "rgba(202,76,22,0.85)", fontWeight: 500 }}
                  >
                    Browse the deck →
                  </a>
                </div>
              </div>
            )}

            {(stage === "loading" || stage === "revealing") && (
              <div className="flex flex-col items-center gap-3 fade-in">
                <p
                  key={stepIndex}
                  className="fade-in"
                  style={{
                    fontSize: "0.95rem",
                    color: "rgba(252,252,253,0.85)",
                    fontWeight: 500,
                  }}
                >
                  {ANALYSIS_STEPS[stepIndex]}…
                </p>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "rgba(252,252,253,0.32)",
                    letterSpacing: "0.06em",
                    fontFeatureSettings: "'tnum'",
                  }}
                >
                  {phone}
                </p>
              </div>
            )}

            {stage === "result" && data && (
              <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-6 fade-in">
                <p
                  className="text-center"
                  style={{
                    fontSize: "1rem",
                    lineHeight: 1.55,
                    color: "rgba(252,252,253,0.7)",
                    maxWidth: "32rem",
                    fontWeight: 400,
                  }}
                >
                  {data.motivation}
                </p>

                <RevealToggle on={revealCode} onChange={setRevealCode} />

                <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-[560px]">
                  <button
                    onClick={handleSaveCard}
                    disabled={savingCard}
                    className="kp-pill flex-1"
                  >
                    {savingCard ? "Saving…" : "Save Card"}
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="kp-pill flex-1"
                    style={{
                      background: "rgba(255,255,255,0.10)",
                      boxShadow: "none",
                    }}
                  >
                    {copyState === "copied" ? "✓ Copied" : "Copy Code"}
                  </button>
                  <button onClick={handleReset} className="kp-pill-ghost flex-1">
                    Read Again
                  </button>
                </div>
              </div>
            )}

            {stage === "error" && (
              <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto fade-in">
                <div
                  className="w-full text-center"
                  style={{
                    padding: "0.85rem 1.5rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(202,76,22,0.3)",
                    background: "rgba(202,76,22,0.06)",
                    color: "rgba(255,180,160,0.95)",
                    fontSize: "0.9rem",
                  }}
                >
                  {error}
                </div>
                <PhoneInput onSubmit={handleSubmit} loading={false} />
                <button
                  onClick={handleReset}
                  style={{ fontSize: "0.78rem", color: "rgba(252,252,253,0.4)" }}
                  className="hover:text-[#FCFCFD] transition-colors"
                >
                  ← back to start
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 sm:px-12 py-5">
        <div
          className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0"
          style={{ borderTop: "1px solid rgba(252,252,253,0.06)", paddingTop: "1rem" }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "rgba(252,252,253,0.32)",
            }}
          >
            A small experiment by KinoPark
          </span>
          <div className="flex items-center gap-5">
            <a
              href="https://kinopark.am"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "0.7rem", color: "rgba(252,252,253,0.5)" }}
              className="hover:text-[#FCFCFD] transition-colors"
            >
              kinopark.am
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontSize: "0.85rem",
        color: "rgba(252,252,253,0.85)",
        fontWeight: 400,
      }}
      className="hover:text-[#FCFCFD] transition-colors"
    >
      {label}
    </a>
  );
}

/** Segmented control above the card. Flips between 16:9 and 9:16. */
function FormatTabs({
  format,
  onChange,
}: {
  format: CardFormat;
  onChange: (next: CardFormat) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Card format"
      className="flex items-center"
      style={{
        gap: "0.25rem",
        padding: "0.3rem",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <FormatTab
        active={format === "horizontal"}
        onClick={() => onChange("horizontal")}
        label="Card"
        aspectIcon="horizontal"
      />
      <FormatTab
        active={format === "story"}
        onClick={() => onChange("story")}
        label="Story"
        aspectIcon="story"
      />
    </div>
  );
}

function FormatTab({
  active,
  onClick,
  label,
  aspectIcon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  aspectIcon: "horizontal" | "story";
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="flex items-center"
      style={{
        gap: "0.45rem",
        padding: "0.45rem 0.95rem",
        borderRadius: "999px",
        background: active ? "#CA4C16" : "transparent",
        color: active ? "#FCFCFD" : "rgba(252,252,253,0.65)",
        fontSize: "0.82rem",
        fontWeight: active ? 600 : 500,
        letterSpacing: "0.02em",
        transition: "background 160ms ease, color 160ms ease",
        cursor: "pointer",
        border: "none",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: aspectIcon === "horizontal" ? "16px" : "10px",
          height: aspectIcon === "horizontal" ? "10px" : "16px",
          borderRadius: "2px",
          background: active ? "#FCFCFD" : "rgba(252,252,253,0.45)",
          transition: "background 160ms ease",
        }}
      />
      <span>{label}</span>
    </button>
  );
}

/** Show-promo toggle below the card. Mirrors the `revealCode` page state. */
function RevealToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        marginTop: "1.4rem",
        gap: "0.7rem",
        padding: "0.45rem 0.85rem 0.45rem 1rem",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span
        style={{
          fontSize: "0.78rem",
          color: on ? "#FCFCFD" : "rgba(252,252,253,0.6)",
          letterSpacing: "0.02em",
          transition: "color 200ms ease",
        }}
      >
        Show promo code
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


