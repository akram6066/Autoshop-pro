"use client";

import { useState, useEffect } from "react";

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });

  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Timer managed inside the effect so the cleanup function returned below
    // can clear it — event handler return values are ignored by the browser.
    let wasOfflineTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      if (wasOfflineTimer) clearTimeout(wasOfflineTimer);
      wasOfflineTimer = setTimeout(() => {
        setWasOffline(false);
        wasOfflineTimer = null;
      }, 0);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
      if (wasOfflineTimer) {
        clearTimeout(wasOfflineTimer);
        wasOfflineTimer = null;
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (wasOfflineTimer) clearTimeout(wasOfflineTimer);
    };
  }, []);

  return { isOnline, wasOffline };
}
