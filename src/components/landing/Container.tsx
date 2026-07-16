function Container({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", ...style }}
    >
      {children}
    </div>
  );
}

export default Container;
