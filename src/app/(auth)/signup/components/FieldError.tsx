export default function FieldError({ message }: { message: string }) {
  return (
    <p
      style={{
        marginTop: 5,
        fontSize: "0.8125rem",
        color: "var(--color-danger)",
      }}
    >
      {message}
    </p>
  );
}
