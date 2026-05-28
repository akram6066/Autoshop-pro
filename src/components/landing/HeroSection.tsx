"use client";

import { useState, useEffect } from "react";
import Container from "./Container";
import HeroBackground from "./hero/HeroBackground";
import HeroHeadline from "./hero/HeroHeadline";
import HeroCTARow from "./hero/HeroCTARow";
import {
  FloatingRevenueCard,
  FloatingStockCard,
  FloatingSaleCard,
} from "./hero/HeroFloatingCards";
import HeroBrowserFrame from "./hero/HeroBrowserFrame";

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

export default function HeroSection() {
  const typedText = useTypewriter(ROTATING_WORDS);

  return (
    <section
      className="pt-16 sm:pt-20 pb-12 sm:pb-20"
      style={{
        background:
          "linear-gradient(180deg, #eef2ff 0%, #f5f3ff 40%, #ffffff 100%)",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <HeroBackground />

      <Container style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            textAlign: "center",
            paddingBottom: 40,
            position: "relative",
            zIndex: 1,
          }}
        >
          <HeroHeadline typedText={typedText} />
          <HeroCTARow />
        </div>

        <div
          className="hero-preview-wrap"
          style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}
        >
          <FloatingRevenueCard />
          <FloatingStockCard />
          <FloatingSaleCard />
          <HeroBrowserFrame />
        </div>
      </Container>
    </section>
  );
}
