export default function HeroBackground() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(ellipse 90% 70% at 50% -5%, #dce6fe 0%, #ede9fe 45%, transparent 72%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />
      <div
        className="h-glow"
        style={{
          position: "absolute",
          top: 60,
          left: -160,
          zIndex: 0,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "#bacffe",
          opacity: 0.35,
          filter: "blur(64px)",
          pointerEvents: "none",
        }}
      />
      <div
        className="h-glow"
        style={{
          position: "absolute",
          top: 40,
          right: -160,
          zIndex: 0,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "#c4b5fd",
          opacity: 0.3,
          filter: "blur(64px)",
          pointerEvents: "none",
          animationDelay: "3s",
        }}
      />
    </>
  );
}
