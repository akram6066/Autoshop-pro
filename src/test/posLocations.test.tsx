import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  resolveProductLocations,
  type LevelRow,
} from "@/hooks/useInventoryLevels";
import { ProductCard } from "@/components/pos/ProductCard";
import { ProductGrid } from "@/app/(shop)/pos/_components/ProductGrid";
import type { Product, Room } from "@/types/app";

const ROOM_MAIN = "11111111-1111-1111-1111-111111111111";
const ROOM_STORE = "22222222-2222-2222-2222-222222222222";
const ROOM_ANNEX = "33333333-3333-3333-3333-333333333333";

const ROOMS: Room[] = [
  {
    id: ROOM_MAIN,
    shop_id: "shop-1",
    name: "Main Floor",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: ROOM_STORE,
    shop_id: "shop-1",
    name: "Store B",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: ROOM_ANNEX,
    shop_id: "shop-1",
    name: "Annex Warehouse",
    created_at: "2026-01-01T00:00:00Z",
  },
];

const ROOM_MAP = new Map(ROOMS.map((r) => [r.id, r.name]));

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    shop_id: "shop-1",
    room_id: ROOM_MAIN,
    name: "Michelin Pilot Sport 4",
    sku: "TIR-MIC-205",
    category: "Tire",
    quantity: 12,
    min_stock: 3,
    price: 18500,
    size: "205/55R16",
    is_archived: false,
    updated_at: "2026-10-29T00:00:00Z",
    ...overrides,
  };
}

describe("resolveProductLocations", () => {
  it("returns empty array when roomMap is empty", () => {
    const product = makeProduct();
    expect(resolveProductLocations(product, [], new Map())).toEqual([]);
  });

  it("returns multiple locations sorted by largest stock first", () => {
    const product = makeProduct({ quantity: 12 });
    const levels = [
      { room_id: ROOM_MAIN, quantity: 4 },
      { room_id: ROOM_STORE, quantity: 8 },
    ];

    expect(resolveProductLocations(product, levels, ROOM_MAP)).toEqual([
      { roomId: ROOM_STORE, roomName: "Store B", quantity: 8 },
      { roomId: ROOM_MAIN, roomName: "Main Floor", quantity: 4 },
    ]);
  });

  it("prioritizes primary room_id when quantities are tied", () => {
    const product = makeProduct({ room_id: ROOM_MAIN, quantity: 10 });
    const levels = [
      { room_id: ROOM_STORE, quantity: 5 },
      { room_id: ROOM_MAIN, quantity: 5 },
    ];

    expect(resolveProductLocations(product, levels, ROOM_MAP)).toEqual([
      { roomId: ROOM_MAIN, roomName: "Main Floor", quantity: 5 },
      { roomId: ROOM_STORE, roomName: "Store B", quantity: 5 },
    ]);
  });

  it("aggregates variant quantities per room", () => {
    const product = makeProduct({ quantity: 0 });
    const levels = [
      { room_id: ROOM_MAIN, quantity: 3 },
      { room_id: ROOM_MAIN, quantity: 2 },
      { room_id: ROOM_ANNEX, quantity: 7 },
    ];

    expect(resolveProductLocations(product, levels, ROOM_MAP)).toEqual([
      { roomId: ROOM_ANNEX, roomName: "Annex Warehouse", quantity: 7 },
      { roomId: ROOM_MAIN, roomName: "Main Floor", quantity: 5 },
    ]);
  });

  it("shows actual holding room when all stock transferred away from primary room", () => {
    const product = makeProduct({ room_id: ROOM_MAIN, quantity: 6 });
    const levels = [
      { room_id: ROOM_MAIN, quantity: 0 },
      { room_id: ROOM_STORE, quantity: 6 },
    ];

    expect(resolveProductLocations(product, levels, ROOM_MAP)).toEqual([
      { roomId: ROOM_STORE, roomName: "Store B", quantity: 6 },
    ]);
  });

  it("falls back to product.room_id when offline (empty levels) or out of stock", () => {
    const offlineProduct = makeProduct({ room_id: ROOM_STORE, quantity: 9 });
    expect(resolveProductLocations(offlineProduct, [], ROOM_MAP)).toEqual([
      { roomId: ROOM_STORE, roomName: "Store B", quantity: 9 },
    ]);

    const outOfStockProduct = makeProduct({ room_id: ROOM_MAIN, quantity: 0 });
    expect(
      resolveProductLocations(
        outOfStockProduct,
        [{ room_id: ROOM_MAIN, quantity: 0 }],
        ROOM_MAP,
      ),
    ).toEqual([{ roomId: ROOM_MAIN, roomName: "Main Floor", quantity: 0 }]);
  });
});

describe("POS ProductCard & ProductGrid locations", () => {
  it("renders single location badge without redundant qty on simple ProductCard", () => {
    const product = makeProduct({ quantity: 12 });
    render(
      <ProductCard
        product={product}
        locations={[
          { roomId: ROOM_MAIN, roomName: "Main Floor", quantity: 12 },
        ]}
        onAdd={vi.fn()}
      />,
    );

    const locContainer = screen.getByTestId("product-card-locations");
    expect(locContainer).toHaveTextContent("Main Floor");
    expect(locContainer).not.toHaveTextContent("· 12");
  });

  it("renders all locations and per-location quantities when product stays in multiple locations", () => {
    const product = makeProduct({ quantity: 12 });
    const onAdd = vi.fn();

    render(
      <ProductCard
        product={product}
        locations={[
          { roomId: ROOM_STORE, roomName: "Store B", quantity: 8 },
          { roomId: ROOM_MAIN, roomName: "Main Floor", quantity: 4 },
        ]}
        onAdd={onAdd}
      />,
    );

    const locContainer = screen.getByTestId("product-card-locations");
    expect(locContainer).toHaveTextContent("Store B");
    expect(locContainer).toHaveTextContent("· 8");
    expect(locContainer).toHaveTextContent("Main Floor");
    expect(locContainer).toHaveTextContent("· 4");

    fireEvent.click(screen.getByTestId("product-card"));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("distinguishes separate per-location product rows and supports searching by location name in ProductGrid", () => {
    const p1 = makeProduct({
      id: "prod-main",
      room_id: ROOM_MAIN,
      quantity: 5,
    });
    const p2 = makeProduct({
      id: "prod-store",
      room_id: ROOM_STORE,
      quantity: 9,
    });
    const levels: LevelRow[] = [
      {
        product_id: "prod-main",
        variant_id: null,
        room_id: ROOM_MAIN,
        quantity: 5,
      },
      {
        product_id: "prod-store",
        variant_id: null,
        room_id: ROOM_STORE,
        quantity: 9,
      },
    ];
    const onAdd = vi.fn();

    render(
      <ProductGrid
        products={[p1, p2]}
        isLoading={false}
        categories={[{ name: "Tire" }]}
        rooms={ROOMS}
        levels={levels}
        variantsByProduct={new Map()}
        onAdd={onAdd}
      />,
    );

    expect(screen.getAllByTestId("product-card")).toHaveLength(2);
    expect(screen.getByText("Main Floor")).toBeInTheDocument();
    expect(screen.getByText("Store B")).toBeInTheDocument();

    // Filter by typing location name in POS search
    const searchInput = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(searchInput, { target: { value: "Store B" } });

    expect(screen.getAllByTestId("product-card")).toHaveLength(1);
    expect(screen.getByText("Store B")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("product-card"));
    expect(onAdd).toHaveBeenCalledWith(p2);
  });

  it("does not nest <button> inside <button> when onShowCustomer is provided", () => {
    const errorSpy = vi.spyOn(console, "error");
    const onAdd = vi.fn();
    const onShowCustomer = vi.fn();
    const product = makeProduct();

    render(
      <ProductCard
        product={product}
        locations={[
          { roomId: ROOM_MAIN, roomName: "Main Floor", quantity: 12 },
        ]}
        onAdd={onAdd}
        onShowCustomer={onShowCustomer}
      />,
    );

    expect(
      errorSpy.mock.calls.some((args) =>
        args.some((a) => String(a).includes("<button> cannot")),
      ),
    ).toBe(false);

    // Clicking inner Customer View button should not trigger card onAdd
    fireEvent.click(screen.getByLabelText("Show Customer View"));
    expect(onShowCustomer).toHaveBeenCalledOnce();
    expect(onAdd).not.toHaveBeenCalled();

    // Keyboard activation on the card itself triggers onAdd
    const card = screen.getByTestId("product-card");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onAdd).toHaveBeenCalledOnce();

    errorSpy.mockRestore();
  });
});
