"use client";
import { useEffect } from "react";
import BrandMark from "./BrandMark";
export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(onComplete, reduced ? 900 : 3200);
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
      <div className="boot-version">ACM-VIT / CONSOLE SYSTEM 27.0</div>
      <div className="boot-emblem">
        <BrandMark />
        <h1>
          OCS<span>27</span>
        </h1>
        <p>Because Technology Matters</p>
      </div>
      <div className="boot-progress">
        <span />
      </div>
      <button onClick={onComplete}>
        Skip startup <kbd>ENTER</kbd>
      </button>
    </div>
  );
}
