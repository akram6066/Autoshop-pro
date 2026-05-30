import { updatePlan } from "../_actions";

export interface PlanRow {
  id: string;
  name: string;
  display_name: string;
  price_kes: number;
  annual_discount_pct: number;
  trial_days: number;
  max_shops: number;
  max_products_per_shop: number;
  max_staff_per_shop: number;
  max_sales_per_month: number;
}

function Field({
  name,
  label,
  defaultValue,
  min,
}: {
  name: string;
  label: string;
  defaultValue: number;
  min?: number;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        name={name}
        type="number"
        defaultValue={defaultValue}
        min={min ?? 0}
        style={{
          width: "100%",
          padding: "7px 10px",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          fontSize: "0.875rem",
          background: "white",
          color: "#0f172a",
        }}
      />
    </div>
  );
}

const PLAN_COLORS: Record<string, string> = {
  pro: "#7c3aed",
  ultra_pro: "#1d4ed8",
  free_forever: "#15803d",
  trial: "#0369a1",
};

export function PlanConfigSection({ plans }: { plans: PlanRow[] }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "22px 24px",
        marginBottom: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontWeight: 700,
            fontSize: "0.9375rem",
            color: "#0f172a",
            marginBottom: 3,
          }}
        >
          Plan Configuration
        </p>
        <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>
          Edit price, trial length, and usage limits for each plan. Changes take
          effect immediately.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {plans.map((plan) => (
          <form
            key={plan.id}
            action={async (fd: FormData) => {
              "use server";
              await updatePlan(plan.id, fd);
            }}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "16px 18px",
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: PLAN_COLORS[plan.name] ?? "#94a3b8",
                }}
              />
              <input
                name="display_name"
                defaultValue={plan.display_name}
                style={{
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "#0f172a",
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  width: 200,
                  borderBottom: "1px dashed #cbd5e1",
                  paddingBottom: 2,
                }}
              />
              <span
                style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: 4 }}
              >
                ({plan.name})
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <Field
                name="price_kes"
                label="Price (KES/mo)"
                defaultValue={plan.price_kes}
                min={0}
              />
              <Field
                name="annual_discount_pct"
                label="Annual discount %"
                defaultValue={plan.annual_discount_pct ?? 20}
                min={0}
              />
              <Field
                name="trial_days"
                label="Trial days"
                defaultValue={plan.trial_days}
                min={0}
              />
              <Field
                name="max_shops"
                label="Max shops"
                defaultValue={plan.max_shops}
                min={1}
              />
              <Field
                name="max_products_per_shop"
                label="Max products/shop"
                defaultValue={plan.max_products_per_shop}
                min={1}
              />
              <Field
                name="max_staff_per_shop"
                label="Max staff/shop"
                defaultValue={plan.max_staff_per_shop}
                min={1}
              />
              <Field
                name="max_sales_per_month"
                label="Max sales/month"
                defaultValue={plan.max_sales_per_month}
                min={1}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="submit"
                style={{
                  padding: "7px 18px",
                  borderRadius: 8,
                  background: "#0f172a",
                  color: "white",
                  border: "none",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save {plan.display_name}
              </button>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                Set 999999 for unlimited
              </span>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
