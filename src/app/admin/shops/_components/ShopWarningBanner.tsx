import { DeleteAllTrashButton } from "./DeleteAllTrashButton";

export function ShopWarningBanner({ deletedCount }: { deletedCount: number }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fef9c3",
          border: "1px solid #fde047",
          borderRadius: 10,
          padding: "11px 16px",
          fontSize: "0.875rem",
          color: "#854d0e",
        }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ flex: 1 }}>
          Deleted shops are hidden from users but all their data (products,
          sales) is preserved. Click{" "}
          <strong style={{ margin: "0 3px" }}>Restore</strong> to make a shop
          active again.
        </span>
        {deletedCount > 2 && <DeleteAllTrashButton count={deletedCount} />}
      </div>
    </div>
  );
}
