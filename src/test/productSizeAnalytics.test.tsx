import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductSizeBreakdown } from "@/app/(shop)/reports/_components/ProductSizeBreakdown";
import { ProductAnalytics } from "@/app/(shop)/reports/_components/ProductAnalytics";
import * as useSalesModule from "@/hooks/useSales";

vi.mock("@/hooks/useSales", async () => {
  const actual =
    await vi.importActual<typeof useSalesModule>("@/hooks/useSales");
  return {
    ...actual,
    useProductAnalytics: vi.fn(),
    useProductSizeAnalytics: vi.fn(),
  };
});

describe("ProductSizeBreakdown & Walking Sizes Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSizes: useSalesModule.ProductSizeAnalyticsRow[] = [
    {
      variant_id: "var-1",
      size: "205/55R16",
      sku: "TIR-205",
      current_stock: 14,
      min_stock: 5,
      units_sold: 48,
      revenue: 288000,
    },
    {
      variant_id: "var-2",
      size: "225/45R17",
      sku: "TIR-225",
      current_stock: 2,
      min_stock: 5, // low stock!
      units_sold: 22,
      revenue: 176000,
    },
    {
      variant_id: "var-3",
      size: "195/65R15",
      sku: "TIR-195",
      current_stock: 0, // out of stock!
      min_stock: 5,
      units_sold: 8,
      revenue: 48000,
    },
  ];

  it("renders sizes ranked by units sold with the #1 size marked as 'Most Walking'", () => {
    vi.mocked(useSalesModule.useProductSizeAnalytics).mockReturnValue({
      data: mockSizes,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSalesModule.useProductSizeAnalytics>);

    render(
      <ProductSizeBreakdown
        shopId="shop-1"
        productId="prod-1"
        productName="Michelin Primacy"
        category="Tire"
        from="2026-10-01"
        to="2026-10-31"
        totalBrandUnits={78}
        totalBrandRevenue={512000}
      />,
    );

    // Verify brand title and category
    expect(screen.getByText("Michelin Primacy")).toBeInTheDocument();
    expect(screen.getByText("Tire")).toBeInTheDocument();

    // Verify top walking size has the Most Walking badge
    expect(screen.getAllByText(/Most Walking/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("205/55R16").length).toBeGreaterThan(0);
    expect(screen.getByText("48")).toBeInTheDocument();

    // Verify low stock / out of stock warning alert is present
    expect(screen.getByText(/Restock Attention:/i)).toBeInTheDocument();
    expect(screen.getByText(/0 in stock/i)).toBeInTheDocument();
    expect(screen.getByText(/2 \(Low\)/i)).toBeInTheDocument();
  });

  it("toggles size breakdown drawer when a product/brand row is clicked in ProductAnalytics", () => {
    vi.mocked(useSalesModule.useProductAnalytics).mockReturnValue({
      data: [
        {
          product_id: "prod-1",
          product_name: "Bridgestone Turanza",
          category: "Tire",
          units_sold: 60,
          revenue: 360000,
        },
      ],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSalesModule.useProductAnalytics>);

    vi.mocked(useSalesModule.useProductSizeAnalytics).mockReturnValue({
      data: mockSizes,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSalesModule.useProductSizeAnalytics>);

    render(
      <ProductAnalytics shopId="shop-1" from="2026-10-01" to="2026-10-31" />,
    );

    // Initially the sizes drawer is not shown
    expect(screen.queryByText(/Size Performance for/i)).not.toBeInTheDocument();

    // Click on the brand row to expand sizes
    const row = screen.getByText("Bridgestone Turanza");
    fireEvent.click(row);

    // The size breakdown drawer is now visible
    expect(screen.getByText(/Size Performance for/i)).toBeInTheDocument();
    expect(screen.getAllByText("205/55R16").length).toBeGreaterThan(0);

    // Clicking again collapses the drawer
    fireEvent.click(row);
    expect(screen.queryByText(/Size Performance for/i)).not.toBeInTheDocument();
  });
});
