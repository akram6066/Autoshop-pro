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

export default function HeroSection() {
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
          <HeroHeadline />
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
