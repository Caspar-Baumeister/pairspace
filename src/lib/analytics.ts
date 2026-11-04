"use client";

import posthog from "posthog-js";

import type { Locale } from "./i18n";

/**
 * PostHog, EU cloud, through our own /ingest proxy (next.config).
 *
 * Cookieless: no cookie and no local storage, PostHog counts unique visitors
 * with a daily rotating hash on its server. That keeps the site free of a
 * consent banner. No person profiles, no session recording, no autocapture,
 * only the events below. Sends nothing outside joinpairspace.com.
 *
 * Event names are snake_case and the same as in the apps:
 *   site      cta_clicked {location}, language_switched {to, source}
 *   video     video_started {lang}, video_progress {lang, percent}, video_completed {lang},
 *             video_paused {lang, seconds}, video_language_changed {lang}
 *   account   signed_in {method, new_account}
 *   landlord  flat_created, rooms_saved {rooms}, plan_started {interval, trial},
 *             link_copied {what}, qr_downloaded, graph_opened {applicants}, group_opened {rank}
 *   applicant applicant_intro_viewed, applicant_started, applicant_rating_done {rated},
 *             applicant_rooms_done, applicant_profile_done {photos}, applicant_contact_done {notify},
 *             applicant_account_secured {method}
 *   feedback  feedback_opened {source}, feedback_sent {kind}
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const LIVE_HOST = "joinpairspace.com";

let ready = false;

export function startAnalytics(locale: Locale) {
  if (ready || !KEY || typeof window === "undefined") return;
  if (window.location.hostname !== LIVE_HOST && process.env.NEXT_PUBLIC_POSTHOG_DEBUG !== "1") return;
  posthog.init(KEY, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "latest",
    cookieless_mode: "always",
    person_profiles: "never",
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: false,
    capture_dead_clicks: false,
    enable_heatmaps: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    // Nothing that is read from the device beyond the request itself (§ 25 TDDDG).
    property_denylist: ["$screen_height", "$screen_width", "$viewport_height", "$viewport_width"],
  });
  posthog.register({ app: "pairspace", locale });
  ready = true;
}

export function setAnalyticsLocale(locale: Locale) {
  if (ready) posthog.register({ locale });
}

export function track(event: string, properties?: Record<string, string | number | boolean | null>) {
  if (ready) posthog.capture(event, properties);
}
