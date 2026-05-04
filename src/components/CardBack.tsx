"use client";

import { KinoLogo } from "@/components/KinoLogo";

/**
 * Card back — KinoPark dark base + atmospheric corner glows + the real
 * three-tree mark centred. Shown before the reveal flips to the front.
 */
export function CardBack() {
  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        aspectRatio: "16 / 9",
        background: "#0A0A0A",
        borderRadius: "1.5cqw",
        containerType: "inline-size",
        color: "#FCFCFD",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Atmospheric corner glow — same as the landing hero */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 0% 100%, rgba(115,160,80,0.20) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 100% 0%, rgba(202,76,22,0.15) 0%, transparent 65%)",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Centered three-tree mark + small green eyebrow underneath */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ gap: "1.6cqw" }}
      >
        <span style={{ display: "inline-flex", height: "10cqw" }}>
          <KinoLogo markOnly />
        </span>

        <div
          style={{
            color: "#A8C53C",
            fontSize: "1.05cqw",
            fontWeight: 500,
            letterSpacing: "0.06em",
          }}
        >
          Your cinema character is loading…
        </div>
      </div>
    </div>
  );
}
