interface Props {
  shopName: string;
  shopAddress: string;
  error: string;
  isPending: boolean;
  mounted: boolean;
  onShopNameChange: (v: string) => void;
  onShopAddressChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SetupShopStep({
  shopName,
  shopAddress,
  error,
  isPending,
  mounted,
  onShopNameChange,
  onShopAddressChange,
  onSubmit,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="p-8 sm:p-10">
      <h2 className="text-2xl font-display font-medium mb-2">Shop details</h2>
      <p
        className="text-base mb-8"
        style={{ color: "var(--color-ink-secondary)" }}
      >
        Your shop name will appear on receipts and reports.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Shop name <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            className="input text-base py-3"
            type="text"
            placeholder="e.g. Nairobi Tyre Centre"
            value={shopName}
            onChange={(e) => onShopNameChange(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Address{" "}
            <span style={{ color: "var(--color-ink-ghost)", fontWeight: 400 }}>
              (optional)
            </span>
          </label>
          <input
            className="input text-base py-3"
            type="text"
            placeholder="e.g. Mombasa Road, Nairobi"
            value={shopAddress}
            onChange={(e) => onShopAddressChange(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <p className="mt-3 text-sm" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        className="btn btn-primary w-full mt-8 py-3 text-base shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
        disabled={!mounted || isPending || !shopName.trim()}
      >
        {isPending ? "Creating…" : "Continue →"}
      </button>
    </form>
  );
}
