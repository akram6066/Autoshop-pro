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

  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasOfflineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const consecutiveFailuresRef = useRef(0);
  const lastSuccessfulCheckRef = useRef<number>(0);

  // Verify actual connectivity by pinging Supabase GoTrue health endpoint
  const verifyConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Check the root URL of the app itself to avoid CORS and Anon key issues
      const response = await fetch("/", {
        method: "HEAD",
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
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (wasOfflineTimerRef.current) clearTimeout(wasOfflineTimerRef.current);
    };
  }, [checkConnectivity]);

  // Listen for browser online/offline events as hints, but verify
  useEffect(() => {
    const handleOnline = () => {
      // Browser thinks we're online - verify immediately
      checkConnectivity();
    };

    const handleOffline = () => {
      // Browser knows we're offline - trust this immediately
      if (isMountedRef.current) {
        setIsOnline(false);
        setWasOffline(false);
        consecutiveFailuresRef.current = 2; // Force offline state
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
      // If we were recently offline, check more frequently
      const timeSinceSuccess = Date.now() - lastSuccessfulCheckRef.current;
      if (timeSinceSuccess < 30000) return 5000; // 5s for 30s after reconnect
      if (timeSinceSuccess < 120000) return 15000; // 15s for 2min
      return 60000; // 1min when stable
    };

    const setupInterval = () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = setInterval(() => {
        checkConnectivity();
        // Reschedule with potentially new interval
        setupInterval();
      }, getCheckInterval());
    };

    setupInterval();

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [checkConnectivity]);

  return { isOnline, wasOffline, isChecking };
}
