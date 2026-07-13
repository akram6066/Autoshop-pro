"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  isChecking: boolean;
}

/**
 * Robust online status detection that actually verifies internet connectivity
 * by pinging the Supabase REST endpoint, not just checking navigator.onLine.
 *
 * navigator.onLine only tells you if you're connected to a router/AP,
 * not if you have actual internet access.
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });
  const [wasOffline, setWasOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const wasOfflineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const consecutiveFailuresRef = useRef(0);
  const lastSuccessfulCheckRef = useRef<number>(0);

  // Verify actual connectivity by pinging Supabase GoTrue health endpoint
  const verifyConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return true;

    try {
      const forceOffline =
        typeof window !== "undefined" &&
        localStorage.getItem("force_offline") === "true";
      if (forceOffline) return false;

      const controller = new AbortController();
      // Increase timeout slightly to be safe
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      // We ping the same-origin /api/health route to completely bypass any CORS issues
      // that might occur when pinging an external Supabase URL.
      const pingUrl = `/api/health`;

      const response = await fetch(pingUrl, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Check connectivity with exponential backoff on failures
  const checkConnectivity = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsChecking(true);
    const online = await verifyConnectivity();

    if (!isMountedRef.current) return;

    setIsChecking(false);

    if (online) {
      consecutiveFailuresRef.current = 0;
      lastSuccessfulCheckRef.current = Date.now();

      if (!isOnline) {
        setIsOnline(true);
        setWasOffline(true);
        if (wasOfflineTimerRef.current)
          clearTimeout(wasOfflineTimerRef.current);
        wasOfflineTimerRef.current = setTimeout(() => {
          setWasOffline(false);
          wasOfflineTimerRef.current = null;
        }, 2000);
      }
    } else {
      consecutiveFailuresRef.current++;

      // Only mark offline after 2 consecutive failures to avoid flapping
      if (consecutiveFailuresRef.current >= 2 && isOnline) {
        setIsOnline(false);
        setWasOffline(false);
        if (wasOfflineTimerRef.current) {
          clearTimeout(wasOfflineTimerRef.current);
          wasOfflineTimerRef.current = null;
        }
      }
    }
  }, [isOnline, verifyConnectivity]);

  // Listen for force offline toggle events
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleForceOfflineToggle = () => {
      checkConnectivity();
    };
    window.addEventListener("force_offline_toggled", handleForceOfflineToggle);
    return () =>
      window.removeEventListener(
        "force_offline_toggled",
        handleForceOfflineToggle,
      );
  }, [checkConnectivity]);

  // Initial check on mount
  useEffect(() => {
    isMountedRef.current = true;
    lastSuccessfulCheckRef.current = Date.now();

    const timer = setTimeout(() => {
      checkConnectivity();
    }, 0);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      if (wasOfflineTimerRef.current) clearTimeout(wasOfflineTimerRef.current);
    };
  }, [checkConnectivity]);

  // Listen for browser online/offline events as hints, but verify
  useEffect(() => {
    const handleOnline = () => {
      checkConnectivity();
    };

    const handleOffline = () => {
      if (isMountedRef.current) {
        setIsOnline(false);
        setWasOffline(false);
        consecutiveFailuresRef.current = 2;
        if (wasOfflineTimerRef.current) {
          clearTimeout(wasOfflineTimerRef.current);
          wasOfflineTimerRef.current = null;
        }
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkConnectivity]);

  // Periodic verification - faster when we just came back online, slower when stable
  useEffect(() => {
    const getCheckInterval = () => {
      const timeSinceSuccess = Date.now() - lastSuccessfulCheckRef.current;
      if (timeSinceSuccess < 30000) return 5000;
      if (timeSinceSuccess < 120000) return 15000;
      return 60000;
    };

    let isActive = true;
    let timerId: ReturnType<typeof setTimeout>;

    const loop = async () => {
      if (!isActive) return;
      await checkConnectivity();
      if (!isActive) return;
      timerId = setTimeout(loop, getCheckInterval());
    };

    // Schedule first loop
    timerId = setTimeout(loop, getCheckInterval());

    return () => {
      isActive = false;
      clearTimeout(timerId);
    };
  }, [checkConnectivity]);

  return { isOnline, wasOffline, isChecking };
}
