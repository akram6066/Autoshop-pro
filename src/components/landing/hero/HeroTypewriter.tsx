"use client";

import { useState, useEffect } from "react";

const ROTATING_WORDS = [
  "Clothing Store",
  "Electronics Shop",
  "Hardware Store",
  "Pharmacy",
  "Grocery Shop",
  "Auto Parts Shop",
  "Shoe Shop",
  "General Store",
];

type Phase = "typing" | "paused" | "deleting";

function useTypewriter(words: string[]) {
  const [displayed, setDisplayed] = useState(words[0]);
  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("paused");

  useEffect(() => {
    const current = words[wordIdx];
    if (phase === "paused") {
      const t = setTimeout(() => setPhase("deleting"), 2200);
      return () => clearTimeout(t);
    }
    if (phase === "deleting") {
      if (displayed.length === 0) {
        const t = setTimeout(() => {
          setWordIdx((i) => (i + 1) % words.length);
          setPhase("typing");
        }, 120);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setDisplayed((d) => d.slice(0, -1)), 38);
      return () => clearTimeout(t);
    }
    if (displayed === current) {
      const t = setTimeout(() => setPhase("paused"), 50);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setDisplayed(current.slice(0, displayed.length + 1)),
      85,
    );
    return () => clearTimeout(t);
  }, [displayed, wordIdx, phase, words]);

  return displayed;
}

export function HeroTypewriter() {
  const text = useTypewriter(ROTATING_WORDS);
  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      style={{
        background:
          "linear-gradient(135deg, #1e40af 0%, #3b6ef5 50%, #7c3aed 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {text}
    </span>
  );
}
