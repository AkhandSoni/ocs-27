"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { STARTUP_DURATION_MS } from "./startup-timeline";

const width = 1280;
const height = 720;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
function smooth(from: number, to: number, value: number) {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}

/** Live reconstruction of the reference's lens sweep and quiet player backdrop.
 * It reuses the original foundation's 2D canvas approach inside the WebGPU room;
 * no recorded footage, background image, or extra WebGL context is loaded.
 */
export default function StartupAtmosphere({ boot, active }: { boot: boolean; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef({ boot, enteredAt: 0 });
  useLayoutEffect(() => {
    stage.current = { boot, enteredAt: performance.now() };
  }, [boot]);

  useEffect(() => {
    if (!active) return;
    const context = canvas.current?.getContext("2d", { alpha: false });
    if (!context) return;
    const ctx = context;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    let lastPhase: boolean | null = null;
    const changeMotion = () => { reduced = motion.matches; lastPhase = null; };
    motion.addEventListener("change", changeMotion);
    let seed = 91;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const particles = Array.from({ length: 250 }, (_, i) => ({
      x: random(), y: random(), depth: random(), phase: random() * Math.PI * 2,
      speed: 0.012 + random() * 0.027,
      radius: i % 23 === 0 ? 3 + random() * 6 : 0.35 + random() * 1.3,
    }));
    const sprites = ["#e6d6b3", "#b7a488", "#d9dce2"].map((color) => {
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = 64;
      const brush = sprite.getContext("2d")!;
      const gradient = brush.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, `${color}ee`);
      gradient.addColorStop(0.18, `${color}b0`);
      gradient.addColorStop(0.4, `${color}30`);
      gradient.addColorStop(1, `${color}00`);
      brush.fillStyle = gradient;
      brush.fillRect(0, 0, 64, 64);
      return sprite;
    });
    let frame = 0;
    let lastFrame = -100;
    const started = performance.now();
    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      if (document.hidden || now - lastFrame < 1000 / 30) return;
      const current = stage.current;
      if (reduced && lastPhase === current.boot) return;
      lastPhase = current.boot;
      lastFrame = now;
      const seconds = current.boot
        ? (now - started) / 1000
        : STARTUP_DURATION_MS / 1000 + (now - current.enteredAt) / 1000;
      const time = reduced ? (current.boot ? 0 : 13.2) : seconds;
      const reveal = smooth(10.4, 12.8, time);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      if (reveal > 0) {
        ctx.globalAlpha = reveal;
        const base = ctx.createLinearGradient(0, 0, width, height);
        base.addColorStop(0, "#353037");
        base.addColorStop(0.45, "#211f2a");
        base.addColorStop(1, "#11111f");
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, width, height);
        const overhead = ctx.createRadialGradient(180, -100, 0, 200, 130, 780);
        overhead.addColorStop(0, "#b6a29b80");
        overhead.addColorStop(0.35, "#b6a29b28");
        overhead.addColorStop(1, "#b6a29b00");
        ctx.fillStyle = overhead;
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.translate(270, 618);
        ctx.scale(2.7, 0.33);
        const horizon = ctx.createRadialGradient(0, 0, 0, 0, 0, 370);
        horizon.addColorStop(0, "#a9b7bd25");
        horizon.addColorStop(0.45, "#a9b7bd10");
        horizon.addColorStop(1, "#a9b7bd00");
        ctx.fillStyle = horizon;
        ctx.fillRect(-400, -400, 800, 800);
        ctx.restore();
      }

      const passage = smooth(6.4, 7.8, time) * (1 - smooth(10.6, 11.6, time));
      if (passage > 0) {
        ctx.globalAlpha = passage;
        const progress = clamp((time - 6.4) / 4.6);
        const centerX = 1610 - progress * 1070;
        const centerY = 590 - Math.sin(progress * Math.PI) * 190;
        const radius = 660 + progress * 420;
        const lens = ctx.createRadialGradient(centerX, centerY, radius * 0.22, centerX, centerY, radius);
        lens.addColorStop(0, "#032030");
        lens.addColorStop(0.68, "#031a27");
        lens.addColorStop(0.88, "#04151e");
        lens.addColorStop(1, "#00000000");
        ctx.fillStyle = lens;
        ctx.fillRect(0, 0, width, height);
        const focus = smooth(9.95, 10.6, time) * (1 - smooth(10.8, 11.4, time));
        for (let i = 0; i < 5 && focus > 0; i++) {
          const x = 1480 - progress * 1420 + i * 210;
          const y = 180 + (i % 3) * 220;
          const size = 90 + (i % 3) * 70;
          const bokeh = ctx.createRadialGradient(x, y, size * 0.55, x, y, size);
          bokeh.addColorStop(0, `rgba(93,151,157,${focus * 0.22})`);
          bokeh.addColorStop(0.65, `rgba(105,163,167,${focus * 0.12})`);
          bokeh.addColorStop(1, "rgba(105,163,167,0)");
          ctx.fillStyle = bokeh;
          ctx.fillRect(x - size, y - size, size * 2, size * 2);
        }
      }

      if (reveal > 0) {
        ctx.globalCompositeOperation = "screen";
        particles.forEach((particle, i) => {
          const progress = (particle.x + time * particle.speed * 0.3) % 1;
          const x = progress * 1540 - 130;
          const stream = 620 - x * 0.18 + Math.sin(x * 0.003 + time * 0.08) * 55;
          const y = stream + (particle.y - 0.5) * (160 + particle.depth * 420);
          const radius = particle.radius * (1 + particle.depth * 1.3);
          ctx.globalAlpha = reveal * Math.sin(progress * Math.PI) * (0.33 + Math.sin(time * 0.35 + particle.phase) * 0.14);
          ctx.drawImage(sprites[i % 9 === 0 ? 2 : i % 3 === 0 ? 0 : 1], x - radius * 3, y - radius * 3, radius * 6, radius * 6);
          if (radius < 1.5 && i % 4 === 0) {
            ctx.fillStyle = "#e8e4d8";
            ctx.fillRect(x, y, 0.8, 0.8);
          }
        });
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", changeMotion);
    };
  }, [active]);

  return <canvas ref={canvas} width={width} height={height} className={`startup-atmosphere ${active ? "is-active" : ""}`} aria-hidden="true" />;
}
