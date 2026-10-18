"use client";

import { useEffect, useRef } from "react";

export default function StaticScreen({ onPower }: { onPower: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d", { alpha: false });
    if (!element || !context) return;
    const ctx = context;
    const width = (element.width = 256);
    const height = (element.height = 144);
    const pixels = context.createImageData(width, height);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;
    let disposed = false;
    function draw() {
      if (disposed) return;
      for (let i = 0; i < pixels.data.length; i += 4) {
        const grain = Math.random() > 0.5 ? 255 : 0;
        pixels.data[i] = grain;
        pixels.data[i + 1] = grain;
        pixels.data[i + 2] = grain;
        pixels.data[i + 3] = 255;
      }
      ctx.putImageData(pixels, 0, 0);
      if (!reducedMotion.matches && !document.hidden)
        timer = window.setTimeout(draw, 75);
    }
    draw();
    function visibility() {
      window.clearTimeout(timer);
      if (!document.hidden && !reducedMotion.matches) draw();
    }
    function motion() {
      window.clearTimeout(timer);
      if (!reducedMotion.matches) draw();
    }
    document.addEventListener("visibilitychange", visibility);
    reducedMotion.addEventListener("change", motion);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visibility);
      reducedMotion.removeEventListener("change", motion);
    };
  }, []);

  return (
    <main className="tv-static" aria-label="Console powered off">
      <canvas ref={canvas} aria-hidden="true" />
      <div className="tv-static-overlay">
        <p>ACM-VIT / OCS 27</p>
        <h1>System off</h1>
        <button onClick={onPower}>Power on</button>
        <span>Click the console to power it on</span>
      </div>
    </main>
  );
}
