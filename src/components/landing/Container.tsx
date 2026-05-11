function Container({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", ...style }}
    >
      {children}
    </div>
  );
}

export default Container;
