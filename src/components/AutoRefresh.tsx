"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetch server data periodically while the tab is visible (for new messages). */
export default function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
