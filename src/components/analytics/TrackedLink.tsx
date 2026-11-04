"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { track } from "@/lib/analytics";

/** A next/link that sends one event on click, for buttons on server rendered pages. */
export function TrackedLink({
  event,
  properties,
  ...props
}: ComponentProps<typeof Link> & { event: string; properties?: Record<string, string | number | boolean> }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(event, properties);
        props.onClick?.(e);
      }}
    />
  );
}
