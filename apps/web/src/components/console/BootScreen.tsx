"use client";
import { useEffect } from "react";
import BrandMark from "./BrandMark";
export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(onComplete, reduced ? 900 : 17400);
    const skip = (e: KeyboardEvent) => {
      if (e.key === "Tab") return;
      onComplete();
    };
    window.addEventListener("keydown", skip);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", skip);
    };
  }, [onComplete]);
  return (
    <div className="boot-screen" data-console-stage="boot">
      <div className="boot-emblem">
        <BrandMark />
        <h1>OCS ’27</h1>
        <p>Because Technology Matters</p>
      </div>
      <button onClick={onComplete}>
        Skip <kbd>ENTER</kbd>
      </button>
    </div>
  );
}
