"use client";

import React from "react";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${className || ""}`}
      style={{
        background: "var(--color-surface-2)",
        borderRadius: "var(--radius-md)",
        ...style,
      }}
      {...props}
    />
  );
}
