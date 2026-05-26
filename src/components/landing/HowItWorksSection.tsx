import Image from "next/image";
import Container from "./Container";
import SectionHead from "./SectionHead";
import { RevealOnScroll } from "./RevealOnScroll";

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      img: "/step1.png",
      title: "Create your shop",
      desc: "Sign up and add your shop name, address, and storage rooms in under two minutes. No setup fee.",
    },
    {
      num: "02",
      img: "/step2.png",
      title: "Add your inventory",
      desc: "Add items manually or bulk-import via CSV. Set quantity, purchase price, selling price, and room location.",
    },
    {
      num: "03",
      img: "/step3.png",
      title: "Start selling",
      desc: "Your team uses the POS on any device. Sales sync across branches automatically, online or offline.",
    },
  ];

  return (
    <section
      id="how-it-works"
      style={{
        padding: "88px 0",
        background: "linear-gradient(160deg, #fafbff 0%, #f5f0ff 100%)",
      }}
    >
      <Container>
        <RevealOnScroll>
          <SectionHead
            eyebrow="How it works"
            title="Up and running in minutes"
            subtitle="No IT setup, no training sessions. Sign up and go."
          />
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <RevealOnScroll key={step.num} delay={i * 100}>
              <div style={{ position: "relative" }}>
                {/* Connector line between steps */}
                {i < 2 && (
                  <div
                    className="hidden md:block"
                    style={{
                      position: "absolute",
                      top: 28,
                      left: "calc(50% + 32px)",
                      width: "calc(100% - 64px)",
                      height: 2,
                      background: "linear-gradient(to right, #a5b4fc, #c4b5fd)",
                      zIndex: 0,
                    }}
                  />
                )}

                <div
                  style={{
                    textAlign: "center",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {/* Step number circle */}
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b6ef5, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                      boxShadow: "0 0 0 8px rgba(139,92,246,0.12)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        color: "white",
                      }}
                    >
                      {step.num}
                    </span>
                  </div>

                  {/* Screenshot */}
                  <div
                    style={{
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      border: "1px solid var(--color-border)",
                      boxShadow: "var(--shadow-raised)",
                      marginBottom: 24,
                    }}
                  >
                    <Image
                      src={step.img}
                      alt={step.title}
                      width={400}
                      height={300}
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="w-full h-auto"
                    />
                  </div>
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      color: "var(--color-ink-primary)",
                      marginBottom: 8,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--color-ink-secondary)",
                      lineHeight: 1.7,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default HowItWorksSection;
