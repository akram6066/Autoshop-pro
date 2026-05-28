export default function HeroBackground() {
  return (
    <>
      {/* Strong top radial — the primary color source */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(ellipse 80% 55% at 50% -8%, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.12) 45%, transparent 72%)",
          pointerEvents: "none",
        }}
      />

      {/* Dot grid — subtle geometric depth */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(99,102,241,0.13) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Left ambient glow */}
      <div
        className="h-glow"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 40,
          left: -140,
          zIndex: 0,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, #a5b4fc 0%, transparent 70%)",
          opacity: 0.28,
          filter: "blur(72px)",
          pointerEvents: "none",
        }}
      />

      {/* Right ambient glow */}
      <div
        className="h-glow"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 20,
          right: -140,
          zIndex: 0,
          width: 440,
          height: 440,
          borderRadius: "50%",
          background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)",
          opacity: 0.24,
          filter: "blur(72px)",
          pointerEvents: "none",
          animationDelay: "3s",
        }}
      />

      {/* Centre bottom glow — lifts the preview area */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: -60,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 0,
          width: 700,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          filter: "blur(48px)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
