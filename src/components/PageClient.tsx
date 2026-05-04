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
import type { Archetype, Badge, CardStats } from "@/lib/archetypes";

/** Background image used by the 9:16 story card. Drop a JPG/PNG at this
 * path under /public to swap it. Placeholder lives at /public/story-bg.jpg. */
const STORY_BG_URL = "/story-bg.jpg";

type Stage = "landing" | "loading" | "revealing" | "result" | "error";

interface ApiResponse {
  archetype: Archetype;
  badge: Badge;
  stats: CardStats;
  insight: string;
  serial: string;
  motivation: string;
  promocode: string;
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
  const [savingStory, setSavingStory] = useState(false);

  const apiPromiseRef = useRef<Promise<ApiResponse> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const revealTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stepTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const storyRef = useRef<HTMLDivElement>(null);

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

  const handleShare = useCallback(async () => {
    if (!data) return;
    const shareText = `I'm "${data.archetype.title}" at @kinoparkam — ${data.archetype.tagline}\n\nFind your cinema character ↓`;
    const url = typeof window !== "undefined" ? window.location.origin : "https://kinopark.am";

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: shareText, url });
        return;
      } catch {
        /* fall through */
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2200);
    } catch {
      /* ignore */
    }
  }, [data]);

  // Render the hidden 9:16 story card to a PNG and trigger a download.
  // The off-screen render lives at fixed 1080px width so all `cqw` units in
  // MovieCardStory resolve to crisp pixel sizes (1080 × 1920 = IG Story).
  const handleSaveStory = useCallback(async () => {
    if (!storyRef.current || !data || savingStory) return;
    setSavingStory(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(storyRef.current, {
        cacheBust: true,
        pixelRatio: 1, // 1080 is already retina-grade
        skipFonts: false,
      });
      const link = document.createElement("a");
      link.download = `kinopark-${data.archetype.id}-${data.serial}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Save Story failed:", e);
    } finally {
      setSavingStory(false);
    }
  }, [data, savingStory]);

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

          <CardScene
            flipped={isFlipped}
            charging={isCharging}
            interactive={stage === "result"}
            floating={stage === "landing"}
            glowColor={data?.archetype.accent ?? "#CA4C16"}
          >
            <CardBack />
            {data ? (
              <MovieCard
                archetype={data.archetype}
                badge={data.badge}
                stats={data.stats}
                insight={data.insight}
                serial={data.serial}
                promocode={data.promocode}
                revealCode={revealCode}
              />
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

                {/* Show-code toggle. Default OFF — code is blurred so the
                    card screenshots safely. Marketing can hand out personal
                    links with ?reveal=1 to flip it on for specific users. */}
                <RevealToggle
                  on={revealCode}
                  onChange={setRevealCode}
                  code={data.promocode}
                />

                <div className="flex flex-col sm:flex-row gap-3 mt-5 w-full max-w-[560px]">
                  <button onClick={handleShare} className="kp-pill flex-1">
                    {copyState === "copied" ? "✓ Copied" : "Share My Card"}
                  </button>
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

      {/* ── Off-screen 9:16 story canvas — html-to-image renders this node
            into a 1080×1920 PNG when the user clicks "Save Story". Kept in
            the DOM at fixed pixel width so all `cqw` units in MovieCardStory
            resolve consistently regardless of viewport size. */}
      <div
        ref={storyRef}
        aria-hidden
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "1080px",
          pointerEvents: "none",
        }}
      >
        {data && (
          <MovieCardStory
            archetype={data.archetype}
            badge={data.badge}
            stats={data.stats}
            insight={data.insight}
            serial={data.serial}
            promocode={data.promocode}
            revealCode={revealCode}
            bgImageUrl={STORY_BG_URL}
          />
        )}
      </div>

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

function RevealToggle({
  on,
  onChange,
  code,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  code: string;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        marginTop: "1.4rem",
        gap: "0.85rem",
        padding: "0.55rem 1rem 0.55rem 1.1rem",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span
        style={{
          fontSize: "0.78rem",
          color: "rgba(252,252,253,0.55)",
          letterSpacing: "0.02em",
        }}
      >
        Show promo code
      </span>
      <span
        style={{
          fontFamily: "var(--font-display), system-ui",
          fontSize: "0.85rem",
          fontWeight: 700,
          color: on ? "#CA4C16" : "rgba(252,252,253,0.55)",
          letterSpacing: "0.06em",
          filter: on ? "none" : "blur(4px)",
          userSelect: on ? "auto" : "none",
          transition: "filter 200ms ease, color 200ms ease",
        }}
      >
        {code}
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

