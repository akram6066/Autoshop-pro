"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore, selectShopId, selectIsOwner } from "@/stores/authStore";
import { fetchActivity, INVENTORY_TYPES } from "./_lib/fetchActivity";
import type { EventType } from "./_lib/fetchActivity";
import { ActivityFeed } from "./_components/ActivityFeed";
import { ActivityFilterTabs } from "./_components/ActivityFilterTabs";
import type { FilterValue } from "./_components/ActivityFilterTabs";

export default function ActivityPage() {
  const shopId = useAuthStore(selectShopId);
  const isOwner = useAuthStore(selectIsOwner);
  const [filter, setFilter] = useState<FilterValue>("all");

  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["activity", shopId],
    queryFn: () => fetchActivity(shopId!),
    enabled: !!shopId && isOwner,
    staleTime: 1000 * 60,
  });

  const filtered =
    filter === "all"
      ? events
      : events.filter((e) => {
          if (filter === "MEMBER_CHANGE")
            return e.type === "MEMBER_CHANGE" || e.type === "MEMBER_REMOVED";
          if (filter === "inventory")
            return (INVENTORY_TYPES as EventType[]).includes(e.type);
          return e.type === filter;
        });

  if (!isOwner) {
    return (
      <div className="card p-12 text-center">
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Activity log is only visible to shop owners.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Activity log
          </h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            Everything your team has done — last 100 events
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn btn-secondary btn-sm"
        >
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <ActivityFilterTabs filter={filter} onChange={setFilter} />

      {/* Content */}
      <ActivityFeed
        events={filtered}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
      />
    </div>
  );
}
