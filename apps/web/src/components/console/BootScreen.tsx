"use client";
import { useEffect } from "react";
import BrandSymbol from "./BrandSymbol";
import { STARTUP_DURATION_MS } from "./startup-timeline";
export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(onComplete, reduced ? 900 : STARTUP_DURATION_MS);
    const skip = (e: KeyboardEvent) => {
      if (["Enter", " ", "Escape"].includes(e.key)) onComplete();
    };
    window.addEventListener("keydown", skip);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", skip);
    };
  }, [onComplete]);
  return (
    <div className="boot-screen" data-console-stage="boot">
      <div className="boot-emblem"><BrandSymbol /></div>
      <div className="boot-message">
        <p>ACM-VIT · Organizing Committee Selections ’27</p>
        <p>Because Technology Matters</p>
      </div>
      <button onClick={onComplete} aria-label="Skip startup">
        Skip <kbd>ENTER</kbd>
      </button>
    </div>
  );
}
