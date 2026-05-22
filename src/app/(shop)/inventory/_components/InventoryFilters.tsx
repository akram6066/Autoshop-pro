"use client";

import { SearchBar } from "@/components/ui/SearchBar";
import type { Category, CategoryItem, Room } from "@/types/app";

interface InventoryFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  roomFilter: string;
  onRoomFilterChange: (v: string) => void;
  categoryFilter: Category | "all";
  onCategoryFilterChange: (v: Category | "all") => void;
  sortBy: "name" | "qty" | "price";
  onSortByChange: (v: "name" | "qty" | "price") => void;
  rooms: Room[];
  categories: CategoryItem[];
}

export function InventoryFilters({
  search,
  onSearchChange,
  roomFilter,
  onRoomFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
  rooms,
  categories,
}: InventoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-5">
      {/* Search */}
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder="Search products..."
        className="flex-1 min-w-48"
      />

      {/* Room filter */}
      <select
        className="input"
        style={{ width: "auto", minWidth: 140 }}
        value={roomFilter}
        onChange={(e) => onRoomFilterChange(e.target.value)}
      >
        <option value="all">All rooms</option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {/* Category filter */}
      <select
        className="input"
        style={{ width: "auto", minWidth: 130 }}
        value={categoryFilter}
        onChange={(e) =>
          onCategoryFilterChange(e.target.value as Category | "all")
        }
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        className="input"
        style={{ width: "auto", minWidth: 120 }}
        value={sortBy}
        onChange={(e) =>
          onSortByChange(e.target.value as "name" | "qty" | "price")
        }
      >
        <option value="name">Name A–Z</option>
        <option value="qty">Qty ↑</option>
        <option value="price">Price ↓</option>
      </select>
    </div>
  );
}
