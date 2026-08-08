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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
      {/* Search */}
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder="Search products..."
        className="w-full sm:flex-1 sm:min-w-64"
      />

      {/* Filters row on mobile, grouped on desktop */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        {/* Room filter */}
        <select
          className="input flex-1 sm:w-auto"
          style={{ minWidth: 120 }}
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
          className="input flex-1 sm:w-auto"
          style={{ minWidth: 140 }}
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
          className="input flex-1 sm:w-auto"
          style={{ minWidth: 110 }}
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
    </div>
  );
}
