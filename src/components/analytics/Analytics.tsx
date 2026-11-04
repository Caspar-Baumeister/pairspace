"use client";

import { useEffect } from "react";

import { setAnalyticsLocale, startAnalytics } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/client";

/** Starts PostHog once and keeps the page language on every event. */
export function Analytics() {
  const locale = useLocale();
  useEffect(() => {
    startAnalytics(locale);
    setAnalyticsLocale(locale);
  }, [locale]);
  return null;
}
