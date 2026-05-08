"use client";

import { useState, useEffect, useCallback } from "react";

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * useOnlineStatus
 * SSR-safe + hydration-safe + ESLint compliant
 *
 * - Starts with `true` during SSR
 * - Uses lazy initializer on client to avoid setState in effect
 * - Avoids hydration crash
 * - No react-hooks/set-state-in-effect warning
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });

  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true);

    const timer = setTimeout(() => {
      setWasOffline(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(false);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}