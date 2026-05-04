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
      // Wait for fonts so html-to-image doesn't capture FOUT/empty glyphs.
      if (typeof document !== "undefined" && "fonts" in document && document.fonts) {
        await document.fonts.ready;
      }
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
