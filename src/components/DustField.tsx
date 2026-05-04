"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseOpacity: number;
  opacity: number;
}

/**
 * Slow drifting dust motes — projector-beam atmosphere. Warm amber palette
 * matches the marquee accent. Intensity rises during loading/reveal.
 */
export function DustField({ intensity = 0.3 }: { intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(intensity);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let rafId: number;

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    }

    function init() {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const count = Math.min(70, Math.floor((w * h) / 28000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -Math.random() * 0.1 - 0.015,
        size: Math.random() * 1.4 + 0.4,
        baseOpacity: Math.random() * 0.04 + 0.01,
        opacity: 0,
      }));
    }

    function draw() {
      rafId = requestAnimationFrame(draw);
      if (!canvas || !ctx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const inten = intensityRef.current;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx + (Math.random() - 0.5) * 0.05;
        p.y += p.vy * (0.5 + inten * 0.8);

        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const target = p.baseOpacity * (0.6 + inten * 1.8);
        p.opacity += (target - p.opacity) * 0.025;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.85 + inten * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(233, 200, 121, ${p.opacity})`;
        ctx.fill();
      }
    }

    resize();
    window.addEventListener("resize", resize);
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  );
}
